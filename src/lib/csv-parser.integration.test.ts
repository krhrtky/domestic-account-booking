import { describe, it, expect } from "vitest";
import { parseCSV } from "./csv-parser";

describe("CSV Parser Integration Tests", () => {
  describe("L-TA-001: Typical Cases", () => {
    it("parses valid CSV with standard columns", async () => {
      const csvContent = `日付,金額,摘要
2025-01-15,10000,Groceries
2025-01-20,6000,Utilities`;

      const result = await parseCSV(csvContent, "test.csv");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].date).toBe("2025-01-15");
        expect(result.data[0].amount).toBe(10000);
        expect(result.data[0].description).toBe("Groceries");
        expect(result.data[1].date).toBe("2025-01-20");
        expect(result.data[1].amount).toBe(6000);
      }
    });

    it("parses CSV with English column headers", async () => {
      const csvContent = `Date,Amount,Description
2025-01-15,5000,Shopping`;

      const result = await parseCSV(csvContent, "test.csv");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].date).toBe("2025-01-15");
        expect(result.data[0].amount).toBe(5000);
        expect(result.data[0].description).toBe("Shopping");
      }
    });

    it("filters out sensitive columns", async () => {
      const csvContent = `日付,金額,摘要,カード番号
2025-01-15,10000,Test,1234-5678-9012-3456`;

      const result = await parseCSV(csvContent, "test.csv");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.warnings).toBeDefined();
        expect(result.warnings?.[0]).toContain(
          "機密情報を含む可能性のある列を除外しました",
        );
        expect(result.warnings?.[0]).toContain("カード番号");
      }
    });
  });

  describe("L-TA-001: Boundary Cases", () => {
    it("handles empty CSV with headers only", async () => {
      const csvContent = `日付,金額,摘要`;

      const result = await parseCSV(csvContent, "test.csv");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]).toBe("CSVファイルにデータ行がありません");
      }
    });

    it("sanitizes formula injection", async () => {
      const csvContent = `日付,金額,摘要
2025-01-15,10000,=CMD|calc.exe|A0`;

      const result = await parseCSV(csvContent, "test.csv");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].description).toBe("'=CMD|calc.exe|A0");
      }
    });
  });

  describe("L-TA-001: Error Cases", () => {
    it("rejects CSV with missing columns", async () => {
      const csvContent = `日付,摘要
2025-01-15,Test`;

      const result = await parseCSV(csvContent, "test.csv");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]).toContain(
          "必須列（日付、金額、摘要）が見つかりません",
        );
      }
    });

    it("normalizes slash-separated dates", async () => {
      const csvContent = `日付,金額,摘要
2025/01/15,10000,Test`;

      const result = await parseCSV(csvContent, "test.csv");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].date).toBe("2025-01-15");
      }
    });

    it("converts negative amounts to positive", async () => {
      const csvContent = `日付,金額,摘要
2025-01-15,-1000,Test`;

      const result = await parseCSV(csvContent, "test.csv");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].amount).toBe(1000);
      }
    });
  });
});
