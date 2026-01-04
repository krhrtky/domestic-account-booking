import { test, expect } from "@playwright/test";
import {
  createTestUser,
  cleanupTestData,
  TestUser,
  getUserByEmail,
  getTransactionsByGroupId,
} from "../utils/test-helpers";
import { loginUser } from "../utils/demo-helpers";
import path from "path";

test.describe("Scenario 4: CSV Upload & Transaction Import", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let userA: TestUser;
  let groupId: string;

  test.beforeAll(async () => {
    const timestamp = Date.now();
    userA = await createTestUser({
      email: `csv-${timestamp}@example.com`,
      password: "TestPassword123!",
      name: "CSV Test User",
    });
  });

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id);
  });

  test("should upload CSV and import transactions", async ({ page }) => {
    await loginUser(page, userA);
    await page.goto("/settings");

    await page.fill('input[name="groupName"]', "CSV Test Group");
    await page.fill('input[name="ratioA"]', "50");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const userData = await getUserByEmail(userA.email);
    if (!userData?.group_id) {
      throw new Error("Group ID is null - group creation may have failed");
    }
    groupId = userData.group_id;

    await page.goto("/dashboard/transactions/upload");

    const csvFilePath = path.join(
      __dirname,
      "../../tests/fixtures/demo-csvs/valid-transactions.csv",
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFilePath);

    await expect(
      page.getByRole("heading", { name: "列マッピングの確認" }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "プレビューを表示" }).click();

    await expect(
      page.getByRole("heading", { name: "データプレビュー" }),
    ).toBeVisible({ timeout: 10000 });

    const payerSelect = page.locator('select[name="defaultPayerType"]');
    await payerSelect.selectOption("UserA");

    const uploadButton = page.locator('button:has-text("インポート実行")');
    await uploadButton.click();

    await expect(page).toHaveURL("/dashboard/transactions", { timeout: 30000 });
    await page.waitForLoadState("load");
    await page.waitForTimeout(3000);
    await page.reload();
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    await expect(page.getByText("Restaurant Dinner")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Gas Station")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Supermarket")).toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(1000);
    const transactions = await getTransactionsByGroupId(groupId);
    expect(transactions.length).toBeGreaterThanOrEqual(3);
    expect(transactions.some((t) => t.expense_type === "Household")).toBe(true);
  });
});
