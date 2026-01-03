import { describe, it, expect } from "vitest";
import { calculateSettlement } from "./settlement";
import type { Transaction, Group } from "./types";

describe("Settlement Integration Tests", () => {
  describe("L-TA-001: Typical Cases", () => {
    it("calculates settlement with equal 50-50 ratio", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: 50,
        ratio_b: 50,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      const transactions: Transaction[] = [
        {
          id: "1",
          group_id: "group-1",
          user_id: "user-a",
          date: "2025-01-15",
          amount: 10000,
          description: "Groceries",
          payer_type: "UserA",
          actual_payer_type: "UserA",
          actual_payer_user_id: "user-a",
          expense_type: "Household",
          created_at: "2025-01-15",
          updated_at: "2025-01-15",
        },
        {
          id: "2",
          group_id: "group-1",
          user_id: "user-b",
          date: "2025-01-20",
          amount: 6000,
          description: "Utilities",
          payer_type: "UserB",
          actual_payer_type: "UserB",
          actual_payer_user_id: "user-b",
          expense_type: "Household",
          created_at: "2025-01-20",
          updated_at: "2025-01-20",
        },
      ];

      const result = calculateSettlement(transactions, group, "2025-01");

      expect(result.total_household).toBe(16000);
      expect(result.paid_by_a_household).toBe(10000);
      expect(result.paid_by_b_household).toBe(6000);
      expect(result.balance_a).toBe(2000);
    });

    it("calculates settlement with 60-40 ratio", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: 60,
        ratio_b: 40,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      const transactions: Transaction[] = [
        {
          id: "1",
          group_id: "group-1",
          user_id: "user-a",
          date: "2025-01-15",
          amount: 10000,
          description: "Groceries",
          payer_type: "UserA",
          actual_payer_type: "UserA",
          actual_payer_user_id: "user-a",
          expense_type: "Household",
          created_at: "2025-01-15",
          updated_at: "2025-01-15",
        },
      ];

      const result = calculateSettlement(transactions, group, "2025-01");

      expect(result.total_household).toBe(10000);
      expect(result.paid_by_a_household).toBe(10000);
      expect(result.balance_a).toBe(4000);
    });

    it("filters out personal expenses from settlement calculation", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: 50,
        ratio_b: 50,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      const transactions: Transaction[] = [
        {
          id: "1",
          group_id: "group-1",
          user_id: "user-a",
          date: "2025-01-15",
          amount: 10000,
          description: "Groceries",
          payer_type: "UserA",
          actual_payer_type: "UserA",
          actual_payer_user_id: "user-a",
          expense_type: "Household",
          created_at: "2025-01-15",
          updated_at: "2025-01-15",
        },
        {
          id: "2",
          group_id: "group-1",
          user_id: "user-a",
          date: "2025-01-16",
          amount: 5000,
          description: "Personal item",
          payer_type: "UserA",
          actual_payer_type: "UserA",
          actual_payer_user_id: "user-a",
          expense_type: "Personal",
          created_at: "2025-01-16",
          updated_at: "2025-01-16",
        },
      ];

      const result = calculateSettlement(transactions, group, "2025-01");

      expect(result.total_household).toBe(10000);
      expect(result.paid_by_a_household).toBe(10000);
    });
  });

  describe("L-TA-001: Boundary Cases", () => {
    it("handles zero total household expenses", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: 50,
        ratio_b: 50,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      const result = calculateSettlement([], group, "2025-01");

      expect(result.total_household).toBe(0);
      expect(result.balance_a).toBe(0);
    });

    it("handles 100-0 ratio edge case", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: 100,
        ratio_b: 0,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      const transactions: Transaction[] = [
        {
          id: "1",
          group_id: "group-1",
          user_id: "user-b",
          date: "2025-01-15",
          amount: 10000,
          description: "Groceries",
          payer_type: "UserB",
          actual_payer_type: "UserB",
          actual_payer_user_id: "user-b",
          expense_type: "Household",
          created_at: "2025-01-15",
          updated_at: "2025-01-15",
        },
      ];

      const result = calculateSettlement(transactions, group, "2025-01");

      expect(result.balance_a).toBe(-10000);
    });

    it("rounds half-up correctly for odd cents", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: 50,
        ratio_b: 50,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      const transactions: Transaction[] = [
        {
          id: "1",
          group_id: "group-1",
          user_id: "user-a",
          date: "2025-01-15",
          amount: 1001,
          description: "Odd amount",
          payer_type: "UserA",
          actual_payer_type: "UserA",
          actual_payer_user_id: "user-a",
          expense_type: "Household",
          created_at: "2025-01-15",
          updated_at: "2025-01-15",
        },
      ];

      const result = calculateSettlement(transactions, group, "2025-01");

      expect(result.balance_a).toBe(501);
    });
  });

  describe("L-TA-001: Error Cases", () => {
    it("throws error when ratios do not sum to 100", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: 60,
        ratio_b: 50,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      expect(() => {
        calculateSettlement([], group, "2025-01");
      }).toThrow("負担割合の合計は100%である必要があります");
    });

    it("throws error for invalid month format", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: 50,
        ratio_b: 50,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      expect(() => {
        calculateSettlement([], group, "2025-1");
      }).toThrow("月の形式が正しくありません");
    });

    it("throws error for negative ratios", () => {
      const group: Group = {
        id: "group-1",
        name: "Test Group",
        ratio_a: -10,
        ratio_b: 110,
        user_a_id: "user-a",
        user_b_id: "user-b",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      expect(() => {
        calculateSettlement([], group, "2025-01");
      }).toThrow("負担割合Aは0〜100の範囲で入力してください");
    });
  });
});
