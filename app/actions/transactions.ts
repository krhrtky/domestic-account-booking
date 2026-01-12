"use server";

import { parseCSV, detectHeaders } from "@/lib/csv-parser";
import { z } from "zod";
import {
  ExpenseType,
  PayerType,
  ParsedTransaction as ClientParsedTransaction,
  UploadResult,
} from "@/lib/types";
import { db } from "@/db/client";
import { users, groups, transactions as transactionsTable } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { getUserGroupId } from "@/lib/db-cache";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS, CACHE_DURATIONS, cachedFetch } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limiter";
import { eq, and, gte, lt, sql, desc } from "drizzle-orm";

const UploadCSVSchema = z.object({
  csvContent: z.string().min(1),
  fileName: z.string().min(1).max(255),
  payerType: z.enum(["UserA", "UserB"]),
  payerTypes: z.array(z.enum(["UserA", "UserB"])).optional(),
});

const UpdateExpenseTypeSchema = z.object({
  transactionId: z.string().uuid(),
  expenseType: z.enum(["Household", "Personal"]),
});

const GetTransactionsSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  expenseType: z.enum(["Household", "Personal"]).optional(),
  payerType: z.enum(["UserA", "UserB"]).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(10).max(50).optional(),
});

export async function uploadCSV(
  csvContent: string,
  fileName: string,
  payerType: PayerType,
  payerTypes?: PayerType[],
) {
  const user = await requireAuth();

  const rateLimitResult = checkRateLimit(
    user.id,
    {
      maxAttempts: 10,
      windowMs: 60 * 1000,
    },
    "csv-upload",
  );

  if (!rateLimitResult.allowed) {
    return {
      error: `CSV取り込みの試行回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。`,
    };
  }

  const parsed = UploadCSVSchema.safeParse({
    csvContent,
    fileName,
    payerType,
    payerTypes,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const groupId = await getUserGroupId(user.id);

  if (!groupId) {
    return { error: "グループに所属していません" };
  }

  const parseResult = await parseCSV(csvContent, fileName);
  if (!parseResult.success) {
    return { error: parseResult.errors.join(", ") };
  }

  const groupResult = await db
    .select({
      user_a_id: groups.userAId,
      user_b_id: groups.userBId,
    })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (groupResult.length === 0) {
    return { error: "グループが見つかりません" };
  }

  const group = groupResult[0];

  const usersResult = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(eq(users.groupId, groupId));

  const usersByName = new Map<string, string>();
  usersResult.forEach((u) => {
    usersByName.set(u.name.toLowerCase(), u.id);
  });

  const transactionsToInsert = parseResult.data.map((t, index) => {
    const rowPayerType = payerTypes?.[index] ?? payerType;
    let payerUserId: string | null = null;
    if (t.payer_name) {
      const foundUserId = usersByName.get(t.payer_name.toLowerCase());
      if (foundUserId) {
        payerUserId = foundUserId;
      }
    }

    return {
      groupId,
      userId: user.id,
      date: t.date,
      amount: String(t.amount),
      description: t.description,
      payerType: rowPayerType,
      expenseType: "Household" as ExpenseType,
      sourceFileName: t.source_file_name,
      payerUserId,
      actualPayerType: rowPayerType,
      actualPayerUserId: payerUserId,
    };
  });

  try {
    const result = await db
      .insert(transactionsTable)
      .values(transactionsToInsert)
      .returning({ id: transactionsTable.id });

    revalidateTag(CACHE_TAGS.transactions(groupId));
    revalidateTag(CACHE_TAGS.settlementAll(groupId));

    return { success: true, count: result.length };
  } catch (error) {
    return { error: "取引の保存に失敗しました" };
  }
}

export async function detectCSVHeaders(csvContent: string) {
  const user = await requireAuth();

  if (!csvContent || csvContent.trim().length === 0) {
    return { success: false as const, error: "CSVファイルが空です" };
  }

  const byteSize = new TextEncoder().encode(csvContent).length;
  if (byteSize > 5 * 1024 * 1024) {
    return {
      success: false as const,
      error: "ファイルサイズが5MBを超えています",
    };
  }

  const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length > 10000) {
    return { success: false as const, error: "行数が10,000行を超えています" };
  }

  const result = detectHeaders(csvContent);
  if ("error" in result) {
    return { success: false as const, error: result.error };
  }

  return {
    success: true as const,
    headers: result.headers,
    suggestedMapping: result.suggestedMapping,
    excludedHeaders: result.excludedHeaders,
  };
}

export async function uploadParsedTransactions(
  transactions: ClientParsedTransaction[],
  fileName: string,
  payerType: PayerType,
): Promise<UploadResult | { error: string }> {
  const user = await requireAuth();

  const rateLimitResult = checkRateLimit(
    user.id,
    {
      maxAttempts: 10,
      windowMs: 60 * 1000,
    },
    "csv-upload",
  );

  if (!rateLimitResult.allowed) {
    return {
      error: `CSV取り込みの試行回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。`,
    };
  }

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { error: "トランザクションデータが空です" };
  }

  if (transactions.length > 10000) {
    return { error: "トランザクション数は10,000件以下にしてください" };
  }

  const errors: string[] = [];
  transactions.forEach((t, index) => {
    if (!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
      errors.push(`行${index + 1}: 日付形式が不正です`);
    }
    if (
      typeof t.amount !== "number" ||
      t.amount <= 0 ||
      t.amount > 10_000_000
    ) {
      errors.push(`行${index + 1}: 金額が範囲外です（1～10,000,000円）`);
    }
    if (typeof t.description !== "string" || t.description.length > 500) {
      errors.push(`行${index + 1}: 摘要が長すぎます（最大500文字）`);
    }
    if (/^[=+\-@]/.test(t.description)) {
      errors.push(`行${index + 1}: 摘要に使用できない文字が含まれています`);
    }
  });

  if (errors.length > 0) {
    return { error: errors.join(", ") };
  }

  const groupId = await getUserGroupId(user.id);

  if (!groupId) {
    return { error: "グループに所属していません" };
  }

  const groupResult = await db
    .select({
      user_a_id: groups.userAId,
      user_b_id: groups.userBId,
    })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (groupResult.length === 0) {
    return { error: "グループが見つかりません" };
  }

  const usersResult = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(eq(users.groupId, groupId));

  const usersByName = new Map<string, string>();
  usersResult.forEach((u) => {
    usersByName.set(u.name.toLowerCase(), u.id);
  });

  const transactionsToInsert = transactions.map((t) => {
    let payerUserId: string | null = null;
    if (t.payer) {
      const foundUserId = usersByName.get(t.payer.toLowerCase());
      if (foundUserId) {
        payerUserId = foundUserId;
      }
    }

    return {
      groupId,
      userId: user.id,
      date: t.date,
      amount: String(t.amount),
      description: t.description,
      payerType,
      expenseType: "Household" as ExpenseType,
      sourceFileName: fileName,
      payerUserId,
      actualPayerType: payerType,
      actualPayerUserId: payerUserId,
    };
  });

  try {
    const result = await db
      .insert(transactionsTable)
      .values(transactionsToInsert)
      .returning({ id: transactionsTable.id });

    revalidateTag(CACHE_TAGS.transactions(groupId));
    revalidateTag(CACHE_TAGS.settlementAll(groupId));

    return {
      success: true,
      insertedCount: result.length,
      fileName,
    };
  } catch (error) {
    return { error: "取引の保存に失敗しました" };
  }
}

export async function getTransactions(filters?: {
  month?: string;
  expenseType?: ExpenseType;
  payerType?: PayerType;
  page?: number;
  pageSize?: number;
}): Promise<
  | {
      error: {
        payerType?: string[];
        month?: string[];
        expenseType?: string[];
        page?: string[];
        pageSize?: string[];
      };
    }
  | { error: string }
  | {
      success: true;
      transactions: any[];
      pagination: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
      };
      group: {
        user_a_id: string;
        user_a_name: string;
        user_b_id: string | null;
        user_b_name: string | null;
      };
    }
> {
  const user = await requireAuth();

  if (filters) {
    const parsed = GetTransactionsSchema.safeParse(filters);
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }
  }

  const groupId = await getUserGroupId(user.id);

  if (!groupId) {
    return { error: "グループに所属していません" };
  }

  const month = filters?.month ?? "";
  const expenseType = filters?.expenseType ?? "";
  const payerType = filters?.payerType ?? "";
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;

  return cachedFetch(
    async () => {
      const groupResult = await db
        .select({
          user_a_id: groups.userAId,
          user_b_id: groups.userBId,
        })
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);

      if (groupResult.length === 0) {
        return { error: "グループが見つかりません" };
      }

      const groupData = groupResult[0];

      const usersResult = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(eq(users.groupId, groupId));

      const userAData = usersResult.find((u) => u.id === groupData.user_a_id);
      const userBData = usersResult.find((u) => u.id === groupData.user_b_id);

      const conditions = [eq(transactionsTable.groupId, groupId)];

      if (month) {
        const year = month.substring(0, 4);
        const monthStr = month.substring(5, 7);
        const monthNum = parseInt(monthStr, 10);
        const nextMonth =
          monthNum === 12 ? "01" : String(monthNum + 1).padStart(2, "0");
        const nextYear =
          monthNum === 12 ? String(parseInt(year, 10) + 1) : year;

        conditions.push(gte(transactionsTable.date, `${year}-${monthStr}-01`));
        conditions.push(
          lt(transactionsTable.date, `${nextYear}-${nextMonth}-01`),
        );
      }

      if (expenseType) {
        conditions.push(eq(transactionsTable.expenseType, expenseType));
      }

      if (payerType) {
        conditions.push(eq(transactionsTable.actualPayerType, payerType));
      }

      try {
        const countResult = await db
          .select({ total: sql<number>`count(*)` })
          .from(transactionsTable)
          .where(and(...conditions));

        const totalCount = Number(countResult[0].total);
        if (isNaN(totalCount)) {
          return { error: "件数の取得に失敗しました" };
        }
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const safePage = Math.min(page, totalPages);
        const offset = (safePage - 1) * pageSize;

        const result = await db
          .select()
          .from(transactionsTable)
          .where(and(...conditions))
          .orderBy(desc(transactionsTable.date), desc(transactionsTable.id))
          .limit(pageSize)
          .offset(offset);

        const transactions = result.map((row) => ({
          id: row.id,
          group_id: row.groupId,
          user_id: row.userId,
          date: typeof row.date === "string" ? row.date : row.date,
          amount:
            typeof row.amount === "string"
              ? parseFloat(row.amount)
              : row.amount,
          description: row.description,
          payer_type: row.payerType as PayerType,
          payer_user_id: row.payerUserId ?? null,
          actual_payer_type: row.actualPayerType as PayerType,
          actual_payer_user_id: row.actualPayerUserId ?? null,
          expense_type: row.expenseType as ExpenseType,
          source_file_name: row.sourceFileName ?? undefined,
          uploaded_by: row.uploadedBy ?? undefined,
          created_at: row.createdAt,
          updated_at: row.updatedAt,
        }));

        return {
          success: true as const,
          transactions,
          pagination: {
            totalCount,
            totalPages,
            currentPage: safePage,
            pageSize,
          },
          group: {
            user_a_id: groupData.user_a_id,
            user_a_name: userAData?.name || "User A",
            user_b_id: groupData.user_b_id,
            user_b_name: userBData?.name || null,
          },
        };
      } catch (error) {
        return { error: "取引の取得に失敗しました" };
      }
    },
    [
      "transactions",
      groupId,
      month,
      expenseType,
      payerType,
      String(page),
      String(pageSize),
    ],
    {
      revalidate: CACHE_DURATIONS.transactions,
      tags: [CACHE_TAGS.transactions(groupId)],
    },
  );
}

export async function updateTransactionExpenseType(
  transactionId: string,
  expenseType: ExpenseType,
) {
  const user = await requireAuth();

  const parsed = UpdateExpenseTypeSchema.safeParse({
    transactionId,
    expenseType,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const groupId = await getUserGroupId(user.id);

  if (!groupId) {
    return { error: "グループに所属していません" };
  }

  try {
    await db
      .update(transactionsTable)
      .set({ expenseType })
      .where(
        and(
          eq(transactionsTable.id, transactionId),
          eq(transactionsTable.groupId, groupId),
        ),
      );

    revalidateTag(CACHE_TAGS.transactions(groupId));
    revalidateTag(CACHE_TAGS.settlementAll(groupId));

    return { success: true };
  } catch (error) {
    return { error: "取引の更新に失敗しました" };
  }
}

export async function deleteTransaction(transactionId: string) {
  const user = await requireAuth();

  const groupId = await getUserGroupId(user.id);

  if (!groupId) {
    return { error: "グループに所属していません" };
  }

  try {
    await db
      .delete(transactionsTable)
      .where(
        and(
          eq(transactionsTable.id, transactionId),
          eq(transactionsTable.groupId, groupId),
        ),
      );

    revalidateTag(CACHE_TAGS.transactions(groupId));
    revalidateTag(CACHE_TAGS.settlementAll(groupId));

    return { success: true };
  } catch (error) {
    return { error: "取引の削除に失敗しました" };
  }
}

const UpdateActualPayerSchema = z.object({
  transactionId: z.string().uuid(),
  actualPayerUserId: z.string().uuid().nullable(),
  actualPayerType: z.enum(["UserA", "UserB"]),
});

export async function updateTransactionActualPayer(
  transactionId: string,
  actualPayerUserId: string | null,
  actualPayerType: PayerType,
): Promise<{ success: true } | { error: string | Record<string, string[]> }> {
  const user = await requireAuth();

  const parsed = UpdateActualPayerSchema.safeParse({
    transactionId,
    actualPayerUserId,
    actualPayerType,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const groupId = await getUserGroupId(user.id);

  if (!groupId) {
    return { error: "グループに所属していません" };
  }

  if (actualPayerUserId) {
    const userCheck = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, actualPayerUserId), eq(users.groupId, groupId)))
      .limit(1);

    if (userCheck.length === 0) {
      return { error: "この支払い元を設定する権限がありません" };
    }
  }

  try {
    await db
      .update(transactionsTable)
      .set({
        actualPayerUserId,
        actualPayerType,
      })
      .where(
        and(
          eq(transactionsTable.id, transactionId),
          eq(transactionsTable.groupId, groupId),
        ),
      );

    revalidateTag(CACHE_TAGS.transactions(groupId));
    revalidateTag(CACHE_TAGS.settlementAll(groupId));

    return { success: true };
  } catch (error) {
    return { error: "支払い元の更新に失敗しました" };
  }
}

const GetSettlementDataSchema = z.object({
  targetMonth: z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])$/,
      "月の形式が不正です（YYYY-MM形式で入力してください）",
    ),
});

export async function getSettlementData(targetMonth: string): Promise<
  | { error: string }
  | {
      success: true;
      settlement: any;
      userAName: string;
      userBName: string | null;
    }
> {
  const user = await requireAuth();

  const parsed = GetSettlementDataSchema.safeParse({ targetMonth });
  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.targetMonth?.[0] ||
        "月の形式が不正です",
    };
  }

  const groupId = await getUserGroupId(user.id);

  if (!groupId) {
    return { error: "グループに所属していません" };
  }

  return cachedFetch(
    async () => {
      const groupResult = await db
        .select()
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);

      if (groupResult.length === 0) {
        return { error: "グループが見つかりません" };
      }

      const group = groupResult[0];

      const year = targetMonth.substring(0, 4);
      const month = targetMonth.substring(5, 7);
      const monthNum = parseInt(month, 10);
      const nextMonth =
        monthNum === 12 ? "01" : String(monthNum + 1).padStart(2, "0");
      const nextYear = monthNum === 12 ? String(parseInt(year, 10) + 1) : year;

      const transactionsResult = await db
        .select()
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.groupId, groupId),
            gte(transactionsTable.date, `${year}-${month}-01`),
            lt(transactionsTable.date, `${nextYear}-${nextMonth}-01`),
          ),
        );

      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const transactions = transactionsResult.map((row) => ({
        id: row.id,
        group_id: row.groupId,
        user_id: row.userId,
        date:
          typeof row.date === "string"
            ? row.date
            : formatLocalDate(new Date(row.date)),
        amount:
          typeof row.amount === "string" ? parseFloat(row.amount) : row.amount,
        description: row.description,
        payer_type: row.payerType as PayerType,
        payer_user_id: row.payerUserId ?? null,
        actual_payer_type: row.actualPayerType as PayerType,
        actual_payer_user_id: row.actualPayerUserId ?? null,
        expense_type: row.expenseType as ExpenseType,
        source_file_name: row.sourceFileName ?? undefined,
        uploaded_by: row.uploadedBy ?? undefined,
        created_at: row.createdAt ?? "",
        updated_at: row.updatedAt ?? "",
      }));

      const usersResult = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(eq(users.groupId, groupId));

      const userAData = usersResult.find((u) => u.id === group.userAId);
      const userBData = usersResult.find((u) => u.id === group.userBId);

      const { calculateSettlement } = await import("@/lib/settlement");
      const groupForSettlement = {
        id: group.id,
        name: group.name,
        ratio_a: group.ratioA,
        ratio_b: group.ratioB,
        user_a_id: group.userAId,
        user_b_id: group.userBId ?? undefined,
        created_at: group.createdAt ?? "",
        updated_at: group.updatedAt ?? "",
      };
      const settlement = calculateSettlement(
        transactions,
        groupForSettlement,
        targetMonth,
      );

      return {
        success: true as const,
        settlement,
        userAName: userAData?.name || "User A",
        userBName: userBData?.name || null,
      };
    },
    ["settlement", groupId, targetMonth],
    {
      revalidate: CACHE_DURATIONS.settlement,
      tags: [
        CACHE_TAGS.settlement(groupId, targetMonth),
        CACHE_TAGS.settlementAll(groupId),
      ],
    },
  );
}
