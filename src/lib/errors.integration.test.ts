import { describe, it, expect } from "vitest";
import { AppError, ErrorCodes } from "./errors";

describe("Error Handling Integration Tests", () => {
  describe("L-TA-001: Typical Cases", () => {
    it("creates validation error with proper structure", () => {
      const error = new AppError(
        ErrorCodes.VALIDATION.INVALID_INPUT,
        "金額は0以上で入力してください",
        400,
      );

      expect(error.code).toBe(ErrorCodes.VALIDATION.INVALID_INPUT);
      expect(error.message).toBe("金額は0以上で入力してください");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("AppError");
    });

    it("creates authentication error without field", () => {
      const error = new AppError(
        ErrorCodes.AUTH.UNAUTHORIZED,
        "認証が必要です",
        401,
      );

      expect(error.code).toBe(ErrorCodes.AUTH.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
      expect(error.cause).toBeUndefined();
    });

    it("creates config error for missing database URL", () => {
      const error = new AppError(
        ErrorCodes.CONFIG.MISSING_DATABASE_URL,
        "DATABASE_URL environment variable is not set",
        500,
      );

      expect(error.code).toBe(ErrorCodes.CONFIG.MISSING_DATABASE_URL);
      expect(error.statusCode).toBe(500);
    });
  });

  describe("L-TA-001: Boundary Cases", () => {
    it("handles Japanese error messages correctly", () => {
      const error = new AppError(
        ErrorCodes.VALIDATION.INVALID_INPUT,
        "負担割合の合計は100%である必要があります",
        400,
      );

      expect(error.message).toContain("100%");
      expect(error.message).toContain("必要があります");
    });

    it("preserves error stack trace", () => {
      const error = new AppError(
        ErrorCodes.VALIDATION.INVALID_INPUT,
        "Test error",
        400,
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("AppError");
    });
  });

  describe("L-TA-001: Error Cases", () => {
    it("throws AppError instances that can be caught", () => {
      expect(() => {
        throw new AppError(
          ErrorCodes.VALIDATION.INVALID_INPUT,
          "Test error",
          400,
        );
      }).toThrow(AppError);
    });

    it("catches and identifies AppError type", () => {
      try {
        throw new AppError(ErrorCodes.AUTH.UNAUTHORIZED, "認証エラー", 401);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        if (err instanceof AppError) {
          expect(err.code).toBe(ErrorCodes.AUTH.UNAUTHORIZED);
        }
      }
    });
  });
});
