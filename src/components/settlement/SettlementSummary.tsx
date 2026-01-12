"use client";

import { useState } from "react";
import type { Settlement } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

interface SettlementSummaryProps {
  settlement: Settlement;
  userAName: string;
  userBName: string | null;
}

export default function SettlementSummary({
  settlement,
  userAName,
  userBName,
}: SettlementSummaryProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [expandedUser, setExpandedUser] = useState<"A" | "B" | null>(null);

  const getPaymentInstruction = () => {
    if (settlement.balance_a > 0) {
      return {
        message: `${userBName || "ユーザーB"}が${userAName}に支払う`,
        amount: formatCurrency(settlement.balance_a),
        icon: (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        ),
        bgClass: "bg-semantic-success-light",
        borderClass: "border-semantic-success/30",
        textClass: "text-semantic-success",
        accentClass: "bg-semantic-success",
      };
    } else if (settlement.balance_a < 0) {
      return {
        message: `${userAName}が${userBName || "ユーザーB"}に支払う`,
        amount: formatCurrency(Math.abs(settlement.balance_a)),
        icon: (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
        ),
        bgClass: "bg-semantic-info-light",
        borderClass: "border-semantic-info/30",
        textClass: "text-semantic-info",
        accentClass: "bg-semantic-info",
      };
    } else {
      return {
        message: "精算不要",
        amount: "¥0",
        icon: (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ),
        bgClass: "bg-neutral-100",
        borderClass: "border-neutral-200",
        textClass: "text-neutral-600",
        accentClass: "bg-neutral-400",
      };
    }
  };

  const paymentInfo = getPaymentInstruction();

  if (settlement.total_household === 0) {
    return (
      <div
        data-testid="settlement-summary"
        className="card-glass p-8 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-neutral-500">今月の取引はありません</p>
      </div>
    );
  }

  return (
    <div
      data-testid="settlement-summary"
      className="card-glass overflow-hidden"
    >
      <div
        className={`${paymentInfo.bgClass} border-b ${paymentInfo.borderClass} p-6`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl ${paymentInfo.accentClass} text-white flex items-center justify-center`}
            >
              {paymentInfo.icon}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${paymentInfo.textClass} opacity-80`}
              >
                最終精算
              </p>
              <p className={`text-lg font-bold ${paymentInfo.textClass}`}>
                {paymentInfo.message}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              data-testid="settlement-amount"
              className={`text-3xl font-bold ${paymentInfo.textClass}`}
            >
              {paymentInfo.amount}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-brand-accent" />
            支出概要
          </h3>
          <div className="group bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 rounded-xl p-5 border border-brand-primary/10 hover:border-brand-primary/20 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-brand-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-neutral-600">
                家計の支出合計
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {formatCurrency(settlement.total_household)}
            </p>
          </div>
        </div>

        <div className="divider-gradient" />

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-brand-accent" />
            個人の支出
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-testid="user-expense-card-a">
              <button
                onClick={() =>
                  setExpandedUser(expandedUser === "A" ? null : "A")
                }
                className="w-full bg-white rounded-xl p-5 border-2 border-neutral-200 hover:border-brand-primary/30 transition-colors duration-200 text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-neutral-600">
                    {userAName}
                  </p>
                  <svg
                    className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${expandedUser === "A" ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <p
                  data-testid="user-a-total"
                  className="text-xl font-bold text-neutral-900"
                >
                  {formatCurrency(
                    settlement.paid_by_a_household +
                      settlement.paid_by_a_personal,
                  )}
                </p>
              </button>
              {expandedUser === "A" && (
                <div
                  data-testid="user-a-breakdown"
                  className="mt-2 bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3 animate-fade-in-up"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">家計支出</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(settlement.paid_by_a_household)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <span className="text-sm text-neutral-600 cursor-help border-b border-dashed border-neutral-400">
                          個人支出
                        </span>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                          <div className="bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                            個人で消費した支出です。精算計算には含まれません。
                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-neutral-900"></div>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                        精算対象外
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(settlement.paid_by_a_personal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div data-testid="user-expense-card-b">
              <button
                onClick={() =>
                  setExpandedUser(expandedUser === "B" ? null : "B")
                }
                className="w-full bg-white rounded-xl p-5 border-2 border-neutral-200 hover:border-brand-accent/30 transition-colors duration-200 text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-neutral-600">
                    {userBName || "ユーザーB"}
                  </p>
                  <svg
                    className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${expandedUser === "B" ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <p
                  data-testid="user-b-total"
                  className="text-xl font-bold text-neutral-900"
                >
                  {formatCurrency(
                    settlement.paid_by_b_household +
                      settlement.paid_by_b_personal,
                  )}
                </p>
              </button>
              {expandedUser === "B" && (
                <div
                  data-testid="user-b-breakdown"
                  className="mt-2 bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3 animate-fade-in-up"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">家計支出</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(settlement.paid_by_b_household)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <span className="text-sm text-neutral-600 cursor-help border-b border-dashed border-neutral-400">
                          個人支出
                        </span>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                          <div className="bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                            個人で消費した支出です。精算計算には含まれません。
                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-neutral-900"></div>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                        精算対象外
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(settlement.paid_by_b_personal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="divider-gradient" />

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-brand-accent" />
            負担割合
          </h3>
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">
                    {userAName}
                  </span>
                  <span className="text-sm font-bold text-brand-primary">
                    {settlement.ratio_a}%
                  </span>
                </div>
                <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-full transition-all duration-500"
                    style={{ width: `${settlement.ratio_a}%` }}
                  />
                </div>
              </div>
              <div className="w-px h-12 bg-neutral-200" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">
                    {userBName || "ユーザーB"}
                  </span>
                  <span className="text-sm font-bold text-brand-accent">
                    {settlement.ratio_b}%
                  </span>
                </div>
                <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-accent to-brand-accent-light rounded-full transition-all duration-500"
                    style={{ width: `${settlement.ratio_b}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="divider-gradient" />

        <div className="flex justify-center">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="px-6 py-2.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {showBreakdown ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                詳細を閉じる
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                詳細を見る
              </>
            )}
          </button>
        </div>

        {showBreakdown && (
          <div
            data-testid="breakdown-panel"
            className="mt-4 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-6 border border-neutral-200"
          >
            <h4 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-brand-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              精算の内訳
            </h4>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  支払合計
                </p>
                <div className="space-y-2">
                  <div
                    data-testid="paid-by-a-total"
                    className="flex items-center justify-between bg-white rounded-lg p-4 border border-neutral-200"
                  >
                    <span className="text-sm font-medium text-neutral-700">
                      {userAName}
                    </span>
                    <span className="text-lg font-bold text-neutral-900">
                      {formatCurrency(settlement.paid_by_a_household)}
                    </span>
                  </div>
                  <div
                    data-testid="paid-by-b-total"
                    className="flex items-center justify-between bg-white rounded-lg p-4 border border-neutral-200"
                  >
                    <span className="text-sm font-medium text-neutral-700">
                      {userBName || "ユーザーB"}
                    </span>
                    <span className="text-lg font-bold text-neutral-900">
                      {formatCurrency(settlement.paid_by_b_household)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="divider-gradient" />

              <div data-testid="calculation-formula">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  計算式
                </p>
                <div className="bg-white rounded-lg p-4 border border-neutral-200">
                  <code className="text-sm text-neutral-800 block leading-relaxed">
                    Balance = {formatCurrency(settlement.paid_by_a_household)} -
                    (({formatCurrency(settlement.paid_by_a_household)} +{" "}
                    {formatCurrency(settlement.paid_by_b_household)}) ×{" "}
                    {settlement.ratio_a}%)
                    <br />
                    <span className="text-brand-primary font-semibold">
                      = {formatCurrency(settlement.balance_a)}
                    </span>
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
