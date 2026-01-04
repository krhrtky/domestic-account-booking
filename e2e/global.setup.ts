import { chromium, firefox, webkit, FullConfig } from "@playwright/test";
import {
  createTestUser,
  createTestGroup,
  cleanupTestData,
  getAuthUserByEmail,
} from "./utils/test-helpers";
import path from "path";
import fs from "fs";
import { Pool } from "pg";

const STORAGE_STATE_DIR = path.join(__dirname, ".auth");

if (!fs.existsSync(STORAGE_STATE_DIR)) {
  fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true });
}

export const TEST_USER = {
  email: "e2e-test-user@example.com",
  password: "E2ETestPassword123!",
  name: "E2E Test User",
};

const setupAuth = async (
  browserType: "chromium" | "firefox" | "webkit",
  config: FullConfig,
) => {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";
  const storageStatePath = path.join(
    STORAGE_STATE_DIR,
    `user-${browserType}.json`,
  );

  let browser;
  if (browserType === "chromium") {
    browser = await chromium.launch();
  } else if (browserType === "firefox") {
    browser = await firefox.launch();
  } else {
    browser = await webkit.launch();
  }

  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto("/login", { waitUntil: "load" });
    await page.waitForTimeout(2000);

    await page.waitForSelector('input[name="email"]', { timeout: 30000 });
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.waitForTimeout(500);

    await page.click('button[type="submit"]');

    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log(`  Attempt ${attempts + 1}: Current URL = ${currentUrl}`);
      if (currentUrl.includes("/dashboard")) {
        break;
      }
      attempts++;
    }

    if (!page.url().includes("/dashboard")) {
      throw new Error(
        `Failed to navigate to dashboard. Current URL: ${page.url()}`,
      );
    }

    await page.waitForLoadState("load");
    await page.waitForTimeout(1000);

    await context.storageState({ path: storageStatePath });

    console.log(
      `✓ Authentication state saved for ${browserType}: ${storageStatePath}`,
    );
  } catch (error) {
    const errorText = await page
      .locator('[role="alert"], .error, .text-red-500')
      .first()
      .textContent()
      .catch(() => null);
    if (errorText) {
      console.error(`  Page error message: ${errorText}`);
    }
    console.error(`  Current URL: ${page.url()}`);
    console.error(
      `✗ Failed to set up authentication for ${browserType}:`,
      error,
    );
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
};

async function globalSetup(config: FullConfig) {
  console.log("Starting global E2E test setup...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const testPool = new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000,
  });
  try {
    await testPool.query("SELECT 1");
    console.log("✓ Database connection validated");
  } catch (error) {
    console.error("✗ Database connection failed");
    throw new Error("Database connection validation failed");
  } finally {
    await testPool.end();
  }

  let testUser;

  try {
    const existingUser = await getAuthUserByEmail(TEST_USER.email);
    if (existingUser) {
      console.log(`ℹ Cleaning up existing test user: ${TEST_USER.email}`);
      await cleanupTestData(existingUser.id);
    }

    testUser = await createTestUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      name: TEST_USER.name,
    });

    console.log(`✓ Test user created: ${testUser.email} (ID: ${testUser.id})`);

    if (!testUser.id) {
      throw new Error("Test user ID is undefined");
    }

    const groupId = await createTestGroup(testUser.id, {
      name: "E2E Test Group",
      ratioA: 60,
      ratioB: 40,
    });
    console.log(`✓ Test group created for user (Group ID: ${groupId})`);

    const browsers = (
      process.env.CI ? ["chromium"] : ["chromium", "firefox", "webkit"]
    ) as Array<"chromium" | "firefox" | "webkit">;
    for (const browser of browsers) {
      await setupAuth(browser, config);
    }

    console.log("✓ Global setup complete\n");
  } catch (error) {
    console.error("✗ Global setup failed:", error);

    if (testUser?.id) {
      try {
        await cleanupTestData(testUser.id);
        console.log("✓ Test user cleanup completed after failure");
      } catch (cleanupError) {
        console.error("✗ Failed to cleanup test user:", cleanupError);
      }
    }

    throw error;
  }
}

export default globalSetup;
