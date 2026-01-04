import { test, expect } from "@playwright/test";
import { TestUser, getUserByEmail, getGroupById } from "../utils/test-helpers";
import { loginUser } from "../utils/demo-helpers";
import { TEST_USER } from "../global.setup";

test.describe("L-TA-001: Happy Path - Complete User Journey", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let userA: TestUser;
  let groupId: string;

  test.beforeAll(async () => {
    const userData = await getUserByEmail(TEST_USER.email);
    if (!userData) {
      throw new Error(
        "E2E test user not found. Please ensure global setup ran successfully.",
      );
    }
    userA = {
      email: TEST_USER.email,
      password: TEST_USER.password,
      name: TEST_USER.name,
      id: userData.id,
    };
    groupId = userData.group_id!;
  });

  test("should complete user journey with login, view transactions and settlement", async ({
    page,
  }) => {
    await test.step("AC-001: User A login", async () => {
      await page.goto("/login");

      await expect(
        page.getByRole("heading", { name: "ログイン" }),
      ).toBeVisible();

      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      await emailInput.waitFor({ state: "visible" });

      await emailInput.fill(userA.email);
      await passwordInput.fill(userA.password);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForURL("/dashboard", { timeout: 15000 });
    });

    await test.step("AC-010: Verify group exists with ratio", async () => {
      await page.goto("/settings");

      const group = await getGroupById(groupId);
      expect(group?.ratio_a).toBe(60);
      expect(group?.ratio_b).toBe(40);
    });

    await test.step("AC-035: Verify transactions list", async () => {
      await page.goto("/dashboard/transactions");
      await page.waitForLoadState("domcontentloaded");
      const heading = page.getByRole("heading", { name: "取引一覧" });
      await heading.waitFor({ state: "visible", timeout: 15000 });
      await expect(heading).toBeVisible();
    });

    await test.step("AC-045: Settlement calculation display (L-BR-001)", async () => {
      await page.goto("/dashboard");

      await page.waitForSelector('[data-testid="settlement-summary"]', {
        timeout: 5000,
      });

      const emptyMessage = page.getByText("今月の取引はありません");
      const hasTransactions = !(await emptyMessage
        .isVisible()
        .catch(() => false));

      if (hasTransactions) {
        const settlementAmount = await page
          .locator('[data-testid="settlement-amount"]')
          .textContent({ timeout: 5000 });
        expect(settlementAmount).toBeTruthy();
        expect(settlementAmount).toMatch(/¥[\d,]+/);
      } else {
        await expect(emptyMessage).toBeVisible();
      }

      const group = await getGroupById(groupId);
      expect(group?.ratio_a).toBe(60);
      expect(group?.ratio_b).toBe(40);
    });

    await test.step("AC-046: Verify settlement summary display", async () => {
      await page.goto("/dashboard");

      await expect(page.getByTestId("settlement-summary")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("精算サマリー")).toBeVisible();

      const emptyMessage = page.getByText("今月の取引はありません");
      const hasTransactions = !(await emptyMessage
        .isVisible()
        .catch(() => false));

      if (hasTransactions) {
        await expect(page.getByText(/家計の支出合計/)).toBeVisible();
      } else {
        await expect(emptyMessage).toBeVisible();
      }
    });

    await test.step("AC-047: Month navigation", async () => {
      await page.goto("/dashboard");

      const monthSelector = page.getByTestId("month-selector");
      await expect(monthSelector).toBeVisible({ timeout: 5000 });

      const currentMonth = await monthSelector.inputValue();
      expect(currentMonth).toMatch(/\d{4}-\d{2}/);

      const options = await monthSelector.locator("option").allTextContents();
      expect(options.length).toBeGreaterThan(0);

      if (options.length > 1) {
        await monthSelector.selectOption({ index: 1 });
        await page.waitForLoadState("domcontentloaded");

        const newMonth = await monthSelector.inputValue();
        expect(newMonth).not.toBe(currentMonth);

        await expect(page.getByTestId("settlement-summary")).toBeVisible();
      }
    });

    await test.step("AC-050: Logout", async () => {
      await page.goto("/dashboard");

      const logoutButton = page.locator('button:has-text("ログアウト")');
      await logoutButton.click();

      await page.waitForURL("/", { timeout: 10000 });
      await expect(page.getByRole("link", { name: "ログイン" })).toBeVisible();

      await page.goto("/dashboard");
      await expect(page).toHaveURL(/login/, { timeout: 5000 });
    });
  });
});
