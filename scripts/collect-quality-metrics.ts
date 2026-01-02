#!/usr/bin/env ts-node

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { verifyAllLaws } from "./verify-laws-compliance";

interface QualityMetrics {
  timestamp: string;
  context_id: string;
  laws_compliance: {
    total_rules: number;
    applicable_rules: string[];
    violations: Array<{
      rule_id: string;
      severity: string;
      count: number;
    }>;
    compliance_rate: number;
  };
  test_quality: {
    total_tests: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage: {
      overall: number;
      critical_paths: Record<string, number>;
    };
    dataset_compliance: {
      typical: number;
      boundary: number;
      incident: number;
      gray: number;
      attack: number;
    };
  };
  code_quality: {
    lint_errors: number;
    lint_warnings: number;
    type_errors: number;
    security_warnings: number;
    prohibited_expressions: number;
  };
  gate_history: {
    total_reviews: number;
    approved: number;
    requested_changes: number;
    blocker_count: number;
    average_iteration: number;
  };
}

const PROJECT_ROOT = join(__dirname, "..");
const CLAUDE_DIR = join(PROJECT_ROOT, ".claude");

function getContextId(): string {
  const contextsDir = join(CLAUDE_DIR, "contexts");
  if (!existsSync(contextsDir)) {
    return "default";
  }

  const contexts = readdirSync(contextsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({
      name: d.name,
      mtime:
        readdirSync(join(contextsDir, d.name)).length > 0
          ? new Date().getTime()
          : 0,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return contexts[0]?.name || "default";
}

async function collectLawsCompliance(): Promise<
  QualityMetrics["laws_compliance"]
> {
  const results = await verifyAllLaws();
  const allViolations = results.flatMap((r) =>
    r.violations.map((v) => ({
      rule_id: r.rule_id,
      severity: v.severity,
      count: 1,
    })),
  );

  const violationsByRule = allViolations.reduce(
    (acc, v) => {
      const key = v.rule_id;
      if (!acc[key]) {
        acc[key] = { rule_id: v.rule_id, severity: v.severity, count: 0 };
      }
      acc[key].count++;
      return acc;
    },
    {} as Record<string, { rule_id: string; severity: string; count: number }>,
  );

  const totalRules = results.length;
  const compliantRules = results.filter((r) => r.compliant).length;

  return {
    total_rules: totalRules,
    applicable_rules: results.map((r) => r.rule_id),
    violations: Object.values(violationsByRule),
    compliance_rate: Math.round((compliantRules / totalRules) * 100),
  };
}

function collectTestQuality(): QualityMetrics["test_quality"] {
  let testResults = {
    total_tests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    const output = execSync("npm test -- --reporter=json 2>/dev/null || true", {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
    });

    const results = JSON.parse(output);
    testResults = {
      total_tests: results.numTotalTests || 0,
      passed: results.numPassedTests || 0,
      failed: results.numFailedTests || 0,
      skipped: results.numPendingTests || 0,
    };
  } catch (err) {
    console.warn("Test execution failed, using defaults");
  }

  let coverage = {
    overall: 0,
    critical_paths: {} as Record<string, number>,
  };

  try {
    const coveragePath = join(
      PROJECT_ROOT,
      "coverage",
      "coverage-summary.json",
    );
    if (existsSync(coveragePath)) {
      const coverageData = JSON.parse(readFileSync(coveragePath, "utf-8"));
      const total = coverageData.total;

      coverage.overall = Math.round(
        (total.lines.pct +
          total.statements.pct +
          total.branches.pct +
          total.functions.pct) /
          4,
      );

      const settlementPath = Object.keys(coverageData).find((k) =>
        k.includes("settlement.ts"),
      );
      if (settlementPath) {
        const settlementCov = coverageData[settlementPath];
        coverage.critical_paths["src/lib/settlement.ts"] = Math.round(
          (settlementCov.lines.pct + settlementCov.statements.pct) / 2,
        );
      }
    }
  } catch (err) {
    console.warn("Coverage data not found");
  }

  const datasetCompliance = {
    typical: 0,
    boundary: 0,
    incident: 0,
    gray: 0,
    attack: 0,
  };

  try {
    const testFiles = execSync(
      'find src -name "*.test.ts" -o -name "*.spec.ts"',
      {
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
      },
    )
      .trim()
      .split("\n")
      .filter(Boolean);

    for (const file of testFiles) {
      const content = readFileSync(join(PROJECT_ROOT, file), "utf-8");
      datasetCompliance.typical += (content.match(/TYP-\d+/g) || []).length;
      datasetCompliance.boundary += (content.match(/BND-\d+/g) || []).length;
      datasetCompliance.incident += (content.match(/INC-\d+/g) || []).length;
      datasetCompliance.gray += (content.match(/GRAY-\d+/g) || []).length;
      datasetCompliance.attack += (content.match(/ATK-\d+/g) || []).length;
    }
  } catch (err) {
    console.warn("Could not analyze test files");
  }

  return {
    ...testResults,
    coverage,
    dataset_compliance: datasetCompliance,
  };
}

function collectCodeQuality(): QualityMetrics["code_quality"] {
  let lintErrors = 0;
  let lintWarnings = 0;

  try {
    execSync("npm run lint", { cwd: PROJECT_ROOT, stdio: "pipe" });
  } catch (err: any) {
    const output = err.stdout?.toString() || "";
    lintErrors = (output.match(/error/gi) || []).length;
    lintWarnings = (output.match(/warning/gi) || []).length;
  }

  let typeErrors = 0;

  try {
    execSync("npm run type-check", { cwd: PROJECT_ROOT, stdio: "pipe" });
  } catch (err: any) {
    const output = err.stdout?.toString() || "";
    typeErrors = (output.match(/error TS\d+:/g) || []).length;
  }

  return {
    lint_errors: lintErrors,
    lint_warnings: lintWarnings,
    type_errors: typeErrors,
    security_warnings: 0,
    prohibited_expressions: 0,
  };
}

function collectGateHistory(): QualityMetrics["gate_history"] {
  const gateLogPath = join(CLAUDE_DIR, "audit", "quality-gate-decisions.jsonl");

  if (!existsSync(gateLogPath)) {
    return {
      total_reviews: 0,
      approved: 0,
      requested_changes: 0,
      blocker_count: 0,
      average_iteration: 0,
    };
  }

  try {
    const content = readFileSync(gateLogPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const decisions = lines.map((line) => JSON.parse(line));

    const approved = decisions.filter((d) => d.decision === "APPROVE").length;
    const requestedChanges = decisions.filter(
      (d) => d.decision === "REQUEST_CHANGES",
    ).length;
    const blockerCount = decisions.reduce(
      (sum, d) => sum + (d.blocker_count || 0),
      0,
    );
    const avgIteration =
      decisions.reduce((sum, d) => sum + (d.iteration || 1), 0) /
      decisions.length;

    return {
      total_reviews: decisions.length,
      approved,
      requested_changes: requestedChanges,
      blocker_count: blockerCount,
      average_iteration: Math.round(avgIteration * 10) / 10,
    };
  } catch (err) {
    console.warn("Could not parse gate history");
    return {
      total_reviews: 0,
      approved: 0,
      requested_changes: 0,
      blocker_count: 0,
      average_iteration: 0,
    };
  }
}

async function collectMetrics(): Promise<QualityMetrics> {
  const contextId = getContextId();

  console.log("📊 Collecting Quality Metrics...\n");

  console.log("  📋 Laws Compliance...");
  const lawsCompliance = await collectLawsCompliance();

  console.log("  🧪 Test Quality...");
  const testQuality = collectTestQuality();

  console.log("  💻 Code Quality...");
  const codeQuality = collectCodeQuality();

  console.log("  🔍 Gate History...");
  const gateHistory = collectGateHistory();

  return {
    timestamp: new Date().toISOString(),
    context_id: contextId,
    laws_compliance: lawsCompliance,
    test_quality: testQuality,
    code_quality: codeQuality,
    gate_history: gateHistory,
  };
}

async function main() {
  const metrics = await collectMetrics();
  const contextId = metrics.context_id;

  const outputDir = join(CLAUDE_DIR, "contexts", contextId);
  if (!existsSync(outputDir)) {
    const { mkdirSync } = require("fs");
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, "quality-metrics.json");
  writeFileSync(outputPath, JSON.stringify(metrics, null, 2));

  console.log("\n✅ Quality metrics collected");
  console.log(`📁 Output: ${outputPath}`);
  console.log("\nSummary:");
  console.log(`  Laws Compliance: ${metrics.laws_compliance.compliance_rate}%`);
  console.log(
    `  Test Pass Rate: ${Math.round((metrics.test_quality.passed / metrics.test_quality.total_tests) * 100) || 0}%`,
  );
  console.log(`  Code Coverage: ${metrics.test_quality.coverage.overall}%`);
  console.log(`  Active Blockers: ${metrics.gate_history.blocker_count}`);

  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}

export { collectMetrics, QualityMetrics };
