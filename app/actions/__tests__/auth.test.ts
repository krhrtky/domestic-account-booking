import { describe, it, expect, vi, beforeEach } from "vitest";
import { logIn, logOut } from "../auth";
import * as rateLimiter from "@/lib/rate-limiter";
import * as db from "@/lib/db";
import bcrypt from "bcryptjs";

vi.mock("@/lib/rate-limiter");
vi.mock("@/lib/db");
vi.mock("bcryptjs");

describe("app/actions/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logIn", () => {
    describe("L-TA-001: Typical Cases", () => {
      it("成功: 正しいメールアドレスとパスワードでログインできる", async () => {
        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "password123");

        vi.mocked(rateLimiter.checkRateLimit).mockReturnValue({
          allowed: true,
        });

        vi.mocked(db.query).mockResolvedValue({
          rows: [
            {
              id: "user-123",
              password_hash: "$2a$10$hashedpassword",
            },
          ],
          rowCount: 1,
        } as any);

        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

        const result = await logIn(formData);

        expect(result).toEqual({
          success: true,
          userId: "user-123",
        });
        expect(rateLimiter.resetRateLimit).toHaveBeenCalledWith(
          "test@example.com",
          "login",
        );
      });

      it("メールアドレスを小文字に正規化する", async () => {
        const formData = new FormData();
        formData.append("email", "Test@EXAMPLE.COM");
        formData.append("password", "password123");

        vi.mocked(rateLimiter.checkRateLimit).mockReturnValue({
          allowed: true,
        });

        vi.mocked(db.query).mockResolvedValue({
          rows: [{ id: "user-123", password_hash: "$2a$10$hash" }],
          rowCount: 1,
        } as any);

        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

        await logIn(formData);

        expect(db.query).toHaveBeenCalledWith(
          "SELECT id, password_hash FROM auth_users WHERE email = $1",
          ["test@example.com"],
        );
      });
    });

    describe("L-TA-001: Boundary Cases", () => {
      it("エラー: メールアドレスが空", async () => {
        const formData = new FormData();
        formData.append("email", "");
        formData.append("password", "password123");

        const result = await logIn(formData);

        expect(result).toHaveProperty("error");
        expect(result.error).toBeDefined();
      });

      it("エラー: パスワードが空", async () => {
        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "");

        const result = await logIn(formData);

        expect(result).toHaveProperty("error");
      });

      it("エラー: 無効なメールアドレス形式", async () => {
        const formData = new FormData();
        formData.append("email", "invalid-email");
        formData.append("password", "password123");

        const result = await logIn(formData);

        expect(result).toHaveProperty("error");
      });
    });

    describe("L-SC-004: Rate Limiting", () => {
      it("レート制限: 5回/15分を超えるとエラー", async () => {
        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "password123");

        vi.mocked(rateLimiter.checkRateLimit).mockReturnValue({
          allowed: false,
          retryAfter: 900,
        });

        const result = await logIn(formData);

        expect(result).toHaveProperty("error");
        expect(result.error).toContain("ログイン試行回数が上限を超えました");
        expect(result.error).toContain("900秒後");
      });

      it("レート制限チェックに正しいパラメータを渡す", async () => {
        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "password123");

        vi.mocked(rateLimiter.checkRateLimit).mockReturnValue({
          allowed: false,
          retryAfter: 0,
        });

        await logIn(formData);

        expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(
          "test@example.com",
          {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000,
          },
          "login",
        );
      });
    });

    describe("L-SC-001: Authentication", () => {
      it("エラー: 存在しないユーザー", async () => {
        const formData = new FormData();
        formData.append("email", "notfound@example.com");
        formData.append("password", "password123");

        vi.mocked(rateLimiter.checkRateLimit).mockReturnValue({
          allowed: true,
        });

        vi.mocked(db.query).mockResolvedValue({
          rows: [],
          rowCount: 0,
        } as any);

        const result = await logIn(formData);

        expect(result).toEqual({
          error: "メールアドレスまたはパスワードが正しくありません",
        });
      });

      it("エラー: パスワードが一致しない", async () => {
        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "wrongpassword");

        vi.mocked(rateLimiter.checkRateLimit).mockReturnValue({
          allowed: true,
        });

        vi.mocked(db.query).mockResolvedValue({
          rows: [{ id: "user-123", password_hash: "$2a$10$hash" }],
          rowCount: 1,
        } as any);

        vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

        const result = await logIn(formData);

        expect(result).toEqual({
          error: "メールアドレスまたはパスワードが正しくありません",
        });
      });
    });

    describe("L-CX-003: Error Message Clarity", () => {
      it("エラーメッセージが日本語で具体的", async () => {
        const formData = new FormData();
        formData.append("email", "invalid");
        formData.append("password", "password123");

        const result = await logIn(formData);

        expect(result.error).toBeDefined();
        if (typeof result.error === "object" && "email" in result.error) {
          const emailErrors = result.error.email;
          if (Array.isArray(emailErrors)) {
            expect(emailErrors[0]).toContain("有効なメールアドレス");
          }
        }
      });

      it("レート制限エラーは待機時間を明示", async () => {
        const formData = new FormData();
        formData.append("email", "test@example.com");
        formData.append("password", "password123");

        vi.mocked(rateLimiter.checkRateLimit).mockReturnValue({
          allowed: false,
          retryAfter: 300,
        });

        const result = await logIn(formData);

        expect(result.error).toContain("300秒後に再試行");
      });
    });
  });

  describe("logOut", () => {
    it("常に成功を返す", async () => {
      const result = await logOut();
      expect(result).toEqual({ success: true });
    });
  });
});
