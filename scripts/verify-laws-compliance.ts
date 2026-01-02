#!/usr/bin/env ts-node

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
} from "fs";
import { join, relative } from "path";

interface Violation {
  file: string;
  line: number;
  severity: "BLOCKER" | "MAJOR" | "MINOR";
  message: string;
  suggestion: string;
}

interface ComplianceResult {
  rule_id: string;
  compliant: boolean;
  violations: Violation[];
  verification_method: "static" | "test" | "manual";
}

const PROJECT_ROOT = join(__dirname, "..");
const AUDIT_DIR = join(PROJECT_ROOT, ".claude", "audit");

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split("\n").length;
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith(".") && file !== "node_modules" && file !== "dist") {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// L-SC-003: 秘密情報ハードコードチェック
async function checkSecrets(): Promise<ComplianceResult> {
  const violations: Violation[] = [];
  const files = getAllFiles(join(PROJECT_ROOT, "src"));

  const secretPatterns = [
    {
      pattern:
        /(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"][^'"]{10,}['"]/gi,
      name: "API Key or Secret Token",
    },
    {
      pattern: /(password|passwd)\s*[:=]\s*['"][^'"]+['"]/gi,
      name: "Password",
    },
    {
      pattern: /(private[_-]?key)\s*[:=]\s*['"][^'"]{20,}['"]/gi,
      name: "Private Key",
    },
    {
      pattern: /(['"])(?:mongodb|postgres|mysql):\/\/[^'"]+\1/gi,
      name: "Database Connection String",
    },
    {
      pattern: /(['"])(?:https?:\/\/)?[a-zA-Z0-9-]+:[a-zA-Z0-9-]+@[^'"]+\1/gi,
      name: "URL with Credentials",
    },
  ];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const relPath = relative(PROJECT_ROOT, file);

    for (const { pattern, name } of secretPatterns) {
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        if (match.index === undefined) continue;

        const line = getLineNumber(content, match.index);
        const context = content.split("\n")[line - 1]?.trim() || "";

        if (
          context.includes("process.env") ||
          context.includes("import.meta.env")
        ) {
          continue;
        }

        violations.push({
          file: relPath,
          line,
          severity: "BLOCKER",
          message: `Hardcoded ${name} detected: ${match[0].substring(0, 30)}...`,
          suggestion:
            "Use environment variable instead (e.g., process.env.API_KEY)",
        });
      }
    }
  }

  return {
    rule_id: "L-SC-003",
    compliant: violations.length === 0,
    violations,
    verification_method: "static",
  };
}

// L-LC-004: 禁止表現チェック
async function checkProhibitedExpressions(): Promise<ComplianceResult> {
  const violations: Violation[] = [];
  const files = getAllFiles(join(PROJECT_ROOT, "src"));

  const prohibitedPatterns = [
    {
      category: "Superiority Claims",
      patterns: [
        /完璧/g,
        /100%/g,
        /絶対/g,
        /必ず/g,
        /確実/g,
        /業界No\.?1/g,
        /最高/g,
        /最強/g,
        /究極/g,
        /唯一/g,
      ],
      severity: "BLOCKER" as const,
    },
    {
      category: "Professional Advice",
      patterns: [
        /節税/g,
        /確定申告/g,
        /税金が減る/g,
        /投資判断/g,
        /資産運用/g,
        /利益が出る/g,
        /法的に有効/g,
        /契約として成立/g,
      ],
      severity: "BLOCKER" as const,
    },
    {
      category: "Discrimination",
      patterns: [
        /主婦向け/g,
        /男性の稼ぎ/g,
        /女性の家事/g,
        /貧乏/g,
        /金持ち/g,
        /低所得/g,
        /頭が悪い/g,
        /馬鹿でもわかる/g,
      ],
      severity: "BLOCKER" as const,
    },
    {
      category: "Fear Appeals",
      patterns: [
        /損する/g,
        /危険/g,
        /今すぐやらないと/g,
        /今だけ/g,
        /期間限定/g,
        /急いで/g,
        /後悔/g,
        /もったいない/g,
      ],
      severity: "BLOCKER" as const,
    },
  ];

  for (const file of files) {
    if (!file.match(/\.(tsx|jsx)$/)) continue;

    const content = readFileSync(file, "utf-8");
    const relPath = relative(PROJECT_ROOT, file);

    for (const { category, patterns, severity } of prohibitedPatterns) {
      for (const pattern of patterns) {
        const matches = content.matchAll(pattern);

        for (const match of matches) {
          if (match.index === undefined) continue;

          const line = getLineNumber(content, match.index);
          const context = content.split("\n")[line - 1]?.trim() || "";

          if (context.startsWith("//") || context.startsWith("/*")) {
            continue;
          }

          violations.push({
            file: relPath,
            line,
            severity,
            message: `Prohibited expression (${category}): "${match[0]}"`,
            suggestion: "Use neutral expression or remove (see L-LC-004)",
          });
        }
      }
    }
  }

  return {
    rule_id: "L-LC-004",
    compliant: violations.length === 0,
    violations,
    verification_method: "static",
  };
}

// L-RV-001: 課金コード禁止チェック
async function checkNoPaymentCode(): Promise<ComplianceResult> {
  const violations: Violation[] = [];
  const files = getAllFiles(join(PROJECT_ROOT, "src"));

  const paymentPatterns = [
    { pattern: /stripe/gi, name: "Stripe" },
    { pattern: /\bpayment\b/gi, name: "Payment" },
    { pattern: /\bbilling\b/gi, name: "Billing" },
    { pattern: /subscription/gi, name: "Subscription" },
    { pattern: /checkout/gi, name: "Checkout" },
    { pattern: /\bcharge\b/gi, name: "Charge" },
    { pattern: /credit[_-]?card/gi, name: "Credit Card" },
  ];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const relPath = relative(PROJECT_ROOT, file);

    for (const { pattern, name } of paymentPatterns) {
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        if (match.index === undefined) continue;

        const line = getLineNumber(content, match.index);
        const context = content.split("\n")[line - 1]?.trim() || "";

        if (
          context.startsWith("//") ||
          context.includes("example") ||
          context.includes("test")
        ) {
          continue;
        }

        violations.push({
          file: relPath,
          line,
          severity: "BLOCKER",
          message: `Payment-related code detected: ${name}`,
          suggestion: "Remove payment/billing code (see L-RV-001)",
        });
      }
    }
  }

  return {
    rule_id: "L-RV-001",
    compliant: violations.length === 0,
    violations,
    verification_method: "static",
  };
}

async function verifyAllLaws(
  specificRule?: string,
): Promise<ComplianceResult[]> {
  const checks = [
    { rule: "L-SC-003", fn: checkSecrets },
    { rule: "L-LC-004", fn: checkProhibitedExpressions },
    { rule: "L-RV-001", fn: checkNoPaymentCode },
  ];

  const filteredChecks = specificRule
    ? checks.filter((c) => c.rule === specificRule)
    : checks;

  const results: ComplianceResult[] = [];
  for (const { fn } of filteredChecks) {
    results.push(await fn());
  }

  return results;
}

function saveViolationsLog(results: ComplianceResult[]) {
  if (!existsSync(AUDIT_DIR)) {
    const { mkdirSync } = require("fs");
    mkdirSync(AUDIT_DIR, { recursive: true });
  }

  const logPath = join(AUDIT_DIR, "laws-violations.jsonl");
  const timestamp = new Date().toISOString();

  const logEntries = results.flatMap((result) =>
    result.violations.map((v) =>
      JSON.stringify({
        timestamp,
        rule_id: result.rule_id,
        ...v,
      }),
    ),
  );

  if (logEntries.length > 0) {
    writeFileSync(logPath, logEntries.join("\n") + "\n", { flag: "w" });
  } else if (existsSync(logPath)) {
    writeFileSync(logPath, "", { flag: "w" });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const ruleFlag = args.find((a) => a.startsWith("--rule="));
  const specificRule = ruleFlag?.split("=")[1];

  console.log("🔍 Laws Compliance Verification\n");

  const results = await verifyAllLaws(specificRule);
  const allViolations = results.flatMap((r) => r.violations);

  saveViolationsLog(results);

  for (const result of results) {
    const icon = result.compliant ? "✅" : "❌";
    console.log(
      `${icon} ${result.rule_id}: ${result.compliant ? "PASS" : "FAIL"}`,
    );

    if (result.violations.length > 0) {
      console.log(`   Found ${result.violations.length} violation(s):`);
      for (const v of result.violations.slice(0, 5)) {
        console.log(`   - [${v.severity}] ${v.file}:${v.line}`);
        console.log(`     ${v.message}`);
        console.log(`     💡 ${v.suggestion}`);
      }
      if (result.violations.length > 5) {
        console.log(
          `   ... and ${result.violations.length - 5} more violations`,
        );
      }
    }
    console.log("");
  }

  if (allViolations.length > 0) {
    console.log(`\n❌ Laws violations detected: ${allViolations.length} total`);
    console.log(
      `📝 Violations logged to: ${relative(PROJECT_ROOT, join(AUDIT_DIR, "laws-violations.jsonl"))}`,
    );
    process.exit(1);
  } else {
    console.log("✅ All Laws compliance checks passed");
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}

export {
  verifyAllLaws,
  checkSecrets,
  checkProhibitedExpressions,
  checkNoPaymentCode,
};
