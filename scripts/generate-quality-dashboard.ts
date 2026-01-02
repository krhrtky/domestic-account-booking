#!/usr/bin/env ts-node

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { QualityMetrics } from "./collect-quality-metrics";

const PROJECT_ROOT = join(__dirname, "..");
const CLAUDE_DIR = join(PROJECT_ROOT, ".claude");

function getLatestMetrics(): QualityMetrics | null {
  const contextsDir = join(CLAUDE_DIR, "contexts");
  if (!existsSync(contextsDir)) {
    return null;
  }

  const contexts = readdirSync(contextsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const context of contexts) {
    const metricsPath = join(contextsDir, context, "quality-metrics.json");
    if (existsSync(metricsPath)) {
      return JSON.parse(readFileSync(metricsPath, "utf-8"));
    }
  }

  return null;
}

function generateProgressBar(percentage: number, width: number = 10): string {
  const filled = Math.round((percentage / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function getHealthStatus(metrics: QualityMetrics): {
  status: string;
  emoji: string;
  color: string;
} {
  const { compliance_rate } = metrics.laws_compliance;
  const { passed, total_tests } = metrics.test_quality;
  const testPassRate = total_tests > 0 ? (passed / total_tests) * 100 : 0;
  const { blocker_count } = metrics.gate_history;

  if (blocker_count > 0) {
    return { status: "Critical", emoji: "🔴", color: "red" };
  }

  if (compliance_rate >= 95 && testPassRate >= 95) {
    return { status: "Excellent", emoji: "🟢", color: "green" };
  }

  if (compliance_rate >= 80 && testPassRate >= 80) {
    return { status: "Good", emoji: "🟡", color: "yellow" };
  }

  return { status: "Needs Improvement", emoji: "🟡", color: "yellow" };
}

function generateDashboard(metrics: QualityMetrics): string {
  const health = getHealthStatus(metrics);
  const { laws_compliance, test_quality, code_quality, gate_history } = metrics;

  const testPassRate =
    test_quality.total_tests > 0
      ? Math.round((test_quality.passed / test_quality.total_tests) * 100)
      : 0;

  const lawsCompliant =
    laws_compliance.total_rules - laws_compliance.violations.length;
  const lawsTotal = laws_compliance.total_rules;

  let dashboard = `# Quality Dashboard

Last Updated: ${new Date(metrics.timestamp).toLocaleString("ja-JP")}

## Overall Health: ${health.emoji} ${health.status}

\`\`\`
┌─────────────────────────────────────────────┐
│  Laws Compliance:  ${laws_compliance.compliance_rate}%  ${generateProgressBar(laws_compliance.compliance_rate)}  (${lawsCompliant}/${lawsTotal}) │
│  Test Pass Rate:   ${testPassRate}%  ${generateProgressBar(testPassRate)}  (${test_quality.passed}/${test_quality.total_tests}) │
│  Code Coverage:    ${test_quality.coverage.overall}%  ${generateProgressBar(test_quality.coverage.overall)}           │
│  Active Blockers:   ${gate_history.blocker_count}   ${"⚠️".repeat(Math.min(gate_history.blocker_count, 3))}                │
└─────────────────────────────────────────────┘
\`\`\`

## Laws Status

| Category | Compliant | Violations | Rate |
|----------|-----------|------------|------|
`;

  const lawsByCategory = laws_compliance.violations.reduce(
    (acc, v) => {
      const category = v.rule_id.split("-")[1];
      if (!acc[category]) {
        acc[category] = { violations: 0, rules: [] };
      }
      acc[category].violations += v.count;
      acc[category].rules.push(v.rule_id);
      return acc;
    },
    {} as Record<string, { violations: number; rules: string[] }>,
  );

  const categories = ["CX", "RV", "LC", "SC", "OC", "AS", "TA", "BR"];
  for (const cat of categories) {
    const catViolations = lawsByCategory[cat];
    if (catViolations) {
      const icon = "⚠️";
      dashboard += `| L-${cat}     | - | ${catViolations.violations} (${catViolations.rules.join(", ")}) | ${icon} |\n`;
    } else {
      dashboard += `| L-${cat}     | ✅ | 0 | ✅ |\n`;
    }
  }

  dashboard += `\n## Active Blockers\n\n`;

  if (
    laws_compliance.violations.filter((v) => v.severity === "BLOCKER").length >
    0
  ) {
    const blockers = laws_compliance.violations.filter(
      (v) => v.severity === "BLOCKER",
    );
    for (let i = 0; i < blockers.length; i++) {
      const b = blockers[i];
      dashboard += `### BLOCKER-${String(i + 1).padStart(3, "0")}: ${b.rule_id} Violations\n`;
      dashboard += `- **Count**: ${b.count}\n`;
      dashboard += `- **Severity**: CRITICAL\n`;
      dashboard += `- **Status**: Pending resolution\n\n`;
    }
  } else {
    dashboard += `No active blockers. ✅\n\n`;
  }

  dashboard += `## Test Coverage Details\n\n`;
  dashboard += `### Overall Coverage: ${test_quality.coverage.overall}%\n\n`;
  dashboard += `| Path | Coverage |\n`;
  dashboard += `|------|----------|\n`;

  for (const [path, cov] of Object.entries(
    test_quality.coverage.critical_paths,
  )) {
    const icon = cov >= 100 ? "✅" : cov >= 80 ? "🟡" : "🔴";
    dashboard += `| ${path} | ${cov}% ${icon} |\n`;
  }

  dashboard += `\n### Dataset Compliance (L-TA-001)\n\n`;
  dashboard += `| Category | Count | Required | Status |\n`;
  dashboard += `|----------|-------|----------|--------|\n`;

  const datasetReqs = {
    typical: 3,
    boundary: 3,
    incident: 1,
    gray: 1,
    attack: 3,
  };

  for (const [cat, req] of Object.entries(datasetReqs)) {
    const count =
      test_quality.dataset_compliance[
        cat as keyof typeof test_quality.dataset_compliance
      ];
    const icon = count >= req ? "✅" : "⚠️";
    dashboard += `| ${cat.charAt(0).toUpperCase() + cat.slice(1)} | ${count} | ${req}+ | ${icon} |\n`;
  }

  dashboard += `\n## Code Quality\n\n`;
  dashboard += `| Metric | Count | Status |\n`;
  dashboard += `|--------|-------|--------|\n`;
  dashboard += `| Lint Errors | ${code_quality.lint_errors} | ${code_quality.lint_errors === 0 ? "✅" : "🔴"} |\n`;
  dashboard += `| Lint Warnings | ${code_quality.lint_warnings} | ${code_quality.lint_warnings === 0 ? "✅" : "🟡"} |\n`;
  dashboard += `| Type Errors | ${code_quality.type_errors} | ${code_quality.type_errors === 0 ? "✅" : "🔴"} |\n`;

  dashboard += `\n## Gate History\n\n`;
  dashboard += `| Metric | Value |\n`;
  dashboard += `|--------|-------|\n`;
  dashboard += `| Total Reviews | ${gate_history.total_reviews} |\n`;
  dashboard += `| Approved | ${gate_history.approved} |\n`;
  dashboard += `| Requested Changes | ${gate_history.requested_changes} |\n`;
  dashboard += `| Average Iterations | ${gate_history.average_iteration} |\n`;

  if (gate_history.total_reviews > 0) {
    const approvalRate = Math.round(
      (gate_history.approved / gate_history.total_reviews) * 100,
    );
    dashboard += `| Approval Rate | ${approvalRate}% |\n`;
  }

  dashboard += `\n## Recommendations\n\n`;

  const recommendations: string[] = [];

  if (
    laws_compliance.violations.filter((v) => v.severity === "BLOCKER").length >
    0
  ) {
    recommendations.push(
      "🔴 **Critical**: Resolve all BLOCKER-level Laws violations",
    );
  }

  if (testPassRate < 100) {
    recommendations.push(
      `🔴 **Critical**: Fix ${test_quality.failed} failing test(s)`,
    );
  }

  if (test_quality.coverage.overall < 80) {
    recommendations.push(
      `🟡 **High**: Improve overall coverage to 80%+ (current: ${test_quality.coverage.overall}%)`,
    );
  }

  const criticalPaths = Object.entries(
    test_quality.coverage.critical_paths,
  ).filter(([, cov]) => cov < 100);
  if (criticalPaths.length > 0) {
    recommendations.push(
      `🟡 **High**: Achieve 100% coverage on critical paths: ${criticalPaths.map(([p]) => p).join(", ")}`,
    );
  }

  if (code_quality.lint_errors > 0 || code_quality.type_errors > 0) {
    recommendations.push(
      `🟡 **Medium**: Fix ${code_quality.lint_errors + code_quality.type_errors} code quality issues`,
    );
  }

  if (recommendations.length === 0) {
    dashboard += `All quality metrics are within acceptable ranges. ✅\n`;
  } else {
    for (let i = 0; i < recommendations.length; i++) {
      dashboard += `${i + 1}. ${recommendations[i]}\n`;
    }
  }

  dashboard += `\n---\n\n`;
  dashboard += `**Context**: ${metrics.context_id}\n`;
  dashboard += `**Generated**: ${new Date().toISOString()}\n`;

  return dashboard;
}

async function main() {
  console.log("📊 Generating Quality Dashboard...\n");

  const metrics = getLatestMetrics();

  if (!metrics) {
    console.error("❌ No quality metrics found");
    console.error("Run: npx ts-node scripts/collect-quality-metrics.ts");
    process.exit(1);
  }

  const dashboard = generateDashboard(metrics);

  const outputDir = join(CLAUDE_DIR, "contexts", metrics.context_id);
  const outputPath = join(outputDir, "QUALITY-DASHBOARD.md");

  writeFileSync(outputPath, dashboard);

  console.log("✅ Quality dashboard generated");
  console.log(`📁 Output: ${outputPath}\n`);

  console.log("Dashboard Summary:");
  const health = getHealthStatus(metrics);
  console.log(`  Overall Health: ${health.emoji} ${health.status}`);
  console.log(`  Laws Compliance: ${metrics.laws_compliance.compliance_rate}%`);
  console.log(`  Active Blockers: ${metrics.gate_history.blocker_count}`);

  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}

export { generateDashboard };
