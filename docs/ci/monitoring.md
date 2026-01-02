# Week 2: CI並行運用監視ガイド

## 目的

新旧CI両方を並行稼働させ、新CIの安定性を確認する。

## 監視期間

**2026年1月3日（金）〜 2026年1月9日（木）** (7日間)

## 監視対象ワークフロー

### 新ワークフロー（監視対象）

| ワークフロー          | ファイル             | 想定実行時間 | 監視ポイント             |
| --------------------- | -------------------- | ------------ | ------------------------ |
| Laws Compliance Check | laws-check.yml       | 50分         | 最終ゲート成否           |
| Static Analysis       | static-analysis.yml  | 5分          | 静的解析エラー           |
| Unit Tests            | test-unit.yml        | 8分          | カバレッジ閾値           |
| Integration Tests     | test-integration.yml | 15分         | DB接続、マイグレーション |
| E2E Tests             | test-e2e.yml         | 45分         | Playwright安定性         |
| Build                 | build.yml            | 10分         | ビルドエラー             |

### 旧ワークフロー（参照用）

| ワークフロー | ファイル       | 備考                    |
| ------------ | -------------- | ----------------------- |
| CI           | ci.yml         | Week 3で削除予定        |
| E2E Tests    | e2e.yml        | test-e2e.yml に移行済み |
| Lighthouse   | lighthouse.yml | Phase 2で統合予定       |
| Chromatic    | chromatic.yml  | Phase 2で統合予定       |

## 監視指標

### 1. 成功率

**目標:** 新ワークフロー成功率 > 95%

**測定方法:**

```bash
# GitHub CLI で過去7日間のワークフロー実行を確認
gh run list --workflow=laws-check.yml --limit 50 --json conclusion
```

**記録テンプレート:**
| 日付 | 実行回数 | 成功 | 失敗 | 成功率 | 備考 |
|------|---------|------|------|--------|------|
| 1/3 | | | | | |
| 1/4 | | | | | |
| 1/5 | | | | | |
| 1/6 | | | | | |
| 1/7 | | | | | |
| 1/8 | | | | | |
| 1/9 | | | | | |

### 2. 実行時間

**目標:** 新CI実行時間 < 60分

**測定方法:**

```bash
gh run view <run-id> --json timing
```

**記録テンプレート:**
| 日付 | laws-check実行時間 | 旧CI (ci.yml) | 差分 |
|------|-------------------|--------------|------|
| 1/3 | | | |
| 1/4 | | | |
| 1/5 | | | |
| 1/6 | | | |
| 1/7 | | | |
| 1/8 | | | |
| 1/9 | | | |

### 3. 失敗パターン分析

**記録内容:**

- どのジョブが失敗したか
- 失敗の原因（flaky test, 環境問題, 実装バグ）
- 再実行で成功したか

**フォーマット:**

```markdown
### 失敗ログ: YYYY-MM-DD HH:MM

- ワークフロー: <laws-check.yml>
- ジョブ: <test-e2e>
- 原因: <Playwrightタイムアウト>
- 再実行結果: <成功>
- アクション: <タイムアウト値を60秒→90秒に調整>
```

### 4. Laws準拠状況

**確認項目:**

- laws-check.yml の Laws Compliance Summary が全Laws網羅しているか
- 各ワークフローが正しいLawsを検証しているか

**チェックリスト:**

- [ ] L-CX-001: Settlement accuracy (test-unit, test-integration)
- [ ] L-CX-002: UI consistency (test-e2e)
- [ ] L-CX-003: Error message clarity (test-e2e)
- [ ] L-CX-004: Feedback immediacy (test-e2e)
- [ ] L-LC-004: Prohibited expressions (static-analysis)
- [ ] L-SC-001: Auth/Authz (test-e2e)
- [ ] L-SC-002: Injection prevention (test-e2e)
- [ ] L-SC-005: CSRF protection (test-e2e)
- [ ] L-OC-001: Coding standards (static-analysis)
- [ ] L-OC-002: Settlement centralization (static-analysis)
- [ ] L-AS-001: Response format (test-integration)
- [ ] L-AS-002: Input validation (test-integration)
- [ ] L-TA-001: Test dataset categories (test-e2e)
- [ ] L-TA-002: Coverage thresholds (test-unit)
- [ ] L-TA-003: Red team scenarios (test-e2e)
- [ ] L-BR-001: Settlement calculation (test-unit, test-integration)
- [ ] L-BR-006: CSV import rules (test-integration)
- [ ] L-BR-007: Traceability (test-e2e)
- [ ] L-CN-003: Coding agent restrictions (static-analysis)

## デイリーチェックリスト

### 毎朝（9:00）

- [ ] GitHub Actions ダッシュボード確認
- [ ] 過去24時間の新ワークフロー実行結果を確認
- [ ] 失敗したワークフローがあれば原因調査
- [ ] 監視指標シートに記録

### 問題発生時（即座）

- [ ] 失敗ログを記録
- [ ] 原因分類（flaky / 環境 / バグ）
- [ ] 再実行テスト
- [ ] 必要に応じて修正PRを作成

### 毎夕（17:00）

- [ ] 1日の集計（成功率、実行時間）
- [ ] トレンド分析（悪化傾向がないか）
- [ ] 翌日の対応事項を整理

## Week 2終了時（1/9）の判定基準

### ✅ 次のWeekに進む条件（全て満たす必要あり）

1. **成功率:** 新ワークフロー成功率 ≥ 95%
2. **実行時間:** 平均実行時間 < 60分
3. **Laws準拠:** 全Laws検証が正常動作
4. **flaky test:** flaky率 < 2%（再実行で成功した失敗の割合）
5. **重大バグ:** 本番影響のある見逃しバグが0件

### ⚠️ Week 2延長の条件（いずれか該当）

1. 成功率 < 95%
2. 平均実行時間 > 60分
3. Laws検証に漏れがある
4. flaky率 > 5%
5. 重大バグが1件以上発見

### ❌ ロールバックの条件（いずれか該当）

1. 成功率 < 80%
2. 致命的なバグで開発が停止
3. CI実行時間が旧環境の2倍以上
4. Laws準拠率が50%未満

## エスカレーションフロー

### レベル1: 軽微な問題（flaky test）

**対応者:** 開発者本人
**対応時間:** 1営業日以内
**アクション:**

- ログ確認
- 再実行
- flaky testの修正PRを作成

### レベル2: 中程度の問題（特定ジョブの失敗率高い）

**対応者:** チームリード
**対応時間:** 半日以内
**アクション:**

- 根本原因分析
- ワークフロー設定の見直し
- 修正PRレビュー・マージ

### レベル3: 重大な問題（CI全体が機能不全）

**対応者:** プロジェクトマネージャー
**対応時間:** 即座
**アクション:**

- インシデント宣言
- ロールバック検討
- 緊急修正またはWeek 2延長判断

## 週次レポート作成

Week 2終了時（1/9 17:00）に以下のレポートを作成:

```markdown
# Week 2 CI並行運用レポート

## サマリー

- 監視期間: 2026/1/3 - 2026/1/9
- 総実行回数: XX回
- 成功率: XX%
- 平均実行時間: XX分
- flaky率: XX%

## 主な問題と対応

1. [問題内容]
   - 原因: [...]
   - 対応: [...]
   - ステータス: [解決済み/対応中]

## Laws準拠状況

- 全Lawsチェック: [✅/⚠️/❌]
- 漏れたLaws: [なし/L-XX-NNN]

## Week 3移行判定

- 判定: [✅進む / ⚠️延長 / ❌ロールバック]
- 理由: [...]

## 次週アクション

1. [...]
2. [...]
```

## ツール

### GitHub CLI コマンド集

```bash
# 最近のワークフロー実行一覧
gh run list --workflow=laws-check.yml --limit 20

# 特定実行の詳細
gh run view <run-id>

# 失敗したワークフローのみ表示
gh run list --workflow=laws-check.yml --status=failure

# ログのダウンロード
gh run download <run-id>

# ワークフロー再実行
gh run rerun <run-id>
```

### 監視スクリプト（例）

```bash
#!/bin/bash
# scripts/monitor-ci.sh

echo "=== CI Monitoring Report ==="
echo "Date: $(date)"
echo ""

for workflow in laws-check static-analysis test-unit test-integration test-e2e build; do
  echo "Workflow: $workflow"
  gh run list --workflow=${workflow}.yml --limit 10 --json conclusion,createdAt \
    | jq -r '.[] | "\(.createdAt): \(.conclusion)"'
  echo ""
done
```

## 関連ドキュメント

- [CI移行計画](./CI_MIGRATION_PLAN.md)
- [Laws一覧](./laws/README.md)
- [トラブルシューティング](./CI_MIGRATION_PLAN.md#トラブルシューティング)

---

**更新日:** 2026-01-02
**担当者:** [チーム名/担当者名]
**ステータス:** Week 2 準備中
