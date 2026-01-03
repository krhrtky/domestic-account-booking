import { afterAll, beforeAll } from "vitest";

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test_db";
  }
});

afterAll(async () => {});
