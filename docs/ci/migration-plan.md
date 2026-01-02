# CI ワークフロー統合・移行計画

## 概要

テスト種別ごとに1つのワークフローに統合し、Laws準拠を徹底する新しいCI構成への移行計画。

## 新CI構成

### ワークフロー一覧

| #   | ファイル名             | 責務           | 実行時間(目安) | Laws検証                                     |
| --- | ---------------------- | -------------- | -------------- | -------------------------------------------- |
| 1   | `static-analysis.yml`  | 静的解析       | ~5分           | L-OC-001, L-OC-002, L-CN-003, L-LC-004       |
| 2   | `test-unit.yml`        | ユニットテスト | ~8分           | L-TA-002, L-CX-001, L-BR-001                 |
| 3   | `test-integration.yml` | 統合テスト     | ~15分          | L-AS-001, L-AS-002, L-BR-006                 |
| 4   | `test-e2e.yml`         | E2Eテスト      | ~45分          | L-TA-001, L-CX-002/003/004, L-SC-001/002/005 |
| 5   | `build.yml`            | ビルド検証     | ~10分          | -                                            |
| 6   | `laws-check.yml`       | Laws最終ゲート | ~1分           | 全Laws統合チェック                           |

**合計実行時間（並列）:** 約50分（従来比: 135分 → 50分、37%に短縮）

### 依存関係グラフ

```
static-analysis.yml (5分)
    ├─→ test-unit.yml (8分, 並列)
    └─→ test-integration.yml (15分, 並列)
            ↓
        test-e2e.yml (45分)
        build.yml (10分, 並列)
            ↓
        laws-check.yml (最終ゲート)
```

### Laws準拠マッピング

| Laws                                 | ワークフロー                | 検証内容                     |
| ------------------------------------ | --------------------------- | ---------------------------- |
| **L-CX: Customer Experience**        |                             |                              |
| L-CX-001                             | test-unit, test-integration | 精算精度100%                 |
| L-CX-002                             | test-e2e (accessibility)    | UI表示一貫性                 |
| L-CX-003                             | test-e2e (accessibility)    | エラーメッセージ明確性       |
| L-CX-004                             | test-e2e (performance)      | フィードバック即時性         |
| **L-LC: Legal Compliance**           |                             |                              |
| L-LC-004                             | static-analysis             | 禁止表現チェック             |
| **L-SC: Security**                   |                             |                              |
| L-SC-001                             | test-e2e (security)         | 認証・認可                   |
| L-SC-002                             | test-e2e (security)         | インジェクション対策         |
| L-SC-005                             | test-e2e (security)         | CSRF対策                     |
| **L-OC: Organizational Consistency** |                             |                              |
| L-OC-001                             | static-analysis             | コーディング規約             |
| L-OC-002                             | static-analysis             | 精算ロジック集約             |
| **L-AS: API Specification**          |                             |                              |
| L-AS-001                             | test-integration            | レスポンス形式               |
| L-AS-002                             | test-integration            | 入力バリデーション           |
| **L-TA: Test & Audit**               |                             |                              |
| L-TA-001                             | test-e2e                    | テストデータセット分類       |
| L-TA-002                             | test-unit                   | カバレッジ閾値80%+           |
| L-TA-003                             | test-e2e (security)         | レッドチームシナリオ         |
| **L-BR: Business Rules**             |                             |                              |
| L-BR-001                             | test-unit, test-integration | 精算計算ルール               |
| L-BR-006                             | test-integration            | CSV取込ルール                |
| L-BR-007                             | test-e2e                    | トレーサビリティ             |
| **L-CN: Core Needs**                 |                             |                              |
| L-CN-003                             | static-analysis             | コーディングエージェント制約 |

## 移行スケジュール

### Week 1: 新ワークフロー作成・検証（完了）

- [x] Day 1: static-analysis.yml, test-unit.yml 作成
- [x] Day 2: test-integration.yml 作成
- [x] Day 3: test-e2e.yml 作成
- [x] Day 4: build.yml, laws-check.yml 作成
- [ ] Day 5-7: テストブランチで動作確認

### Week 2: 並行運用期間

**目的:** 新ワークフローの安定性確認

**手順:**

1. **Day 1:** 新ワークフローを有効化（既存ワークフローも並行稼働）
2. **Day 2-5:** 両方のワークフローを監視
   - 新ワークフローの失敗率を記録
   - 実行時間を比較
   - 問題があれば修正
3. **Day 6:** ブランチ保護設定を更新
   - 必須チェック: `laws-check.yml` の `laws-summary` ジョブのみ
4. **Day 7:** 最終確認

### Week 3: クリーンアップ

**目的:** 旧ワークフローの削除とドキュメント更新

**手順:**

1. **Day 1-2:** 以下のファイルを削除
   - `.github/workflows/ci.yml` → static-analysis, test-unit, build に統合済み
   - `.github/workflows/laws-validation.yml` → 各ワークフローに分割済み
   - `.github/workflows/e2e.yml` → test-e2e.yml に改名・整理済み
   - `.github/workflows/lighthouse.yml` → test-e2e.yml に統合予定（Phase 2）
   - `.github/workflows/chromatic.yml` → test-e2e.yml に統合予定（Phase 2）

2. **Day 3:** ドキュメント更新
   - `README.md` のCI説明を更新
   - `CLAUDE.md` / `AGENTS.md` のワークフロー参照を更新

3. **Day 4-5:** チームへの周知
   - 新CI構成の説明会
   - トラブルシューティングガイド作成

## 廃止予定のワークフロー

| ファイル              | 廃止理由                 | 移行先                            |
| --------------------- | ------------------------ | --------------------------------- |
| `ci.yml`              | 責務が分散、重複が多い   | static-analysis, test-unit, build |
| `laws-validation.yml` | 単一ファイルで肥大化     | 各ワークフローに分割              |
| `e2e.yml`             | ファイル名が汎用的すぎる | test-e2e.yml に改名               |
| `lighthouse.yml`      | E2Eテストと分離不要      | test-e2e.yml に統合（Phase 2）    |
| `chromatic.yml`       | ビジュアルテストもE2E    | test-e2e.yml に統合（Phase 2）    |

**保持するワークフロー:**

- `storybook-deploy.yml` - デプロイ専用、変更なし

## 統合テスト実装タスク（未完了）

現在、`test-integration.yml` は統合テストが未実装のため、プレースホルダーとして動作します。

### 必要な作業

1. **package.json にスクリプト追加**

   ```json
   {
     "scripts": {
       "test:integration": "vitest --run src/**/*.integration.test.ts"
     }
   }
   ```

2. **統合テストファイル作成例**
   - `src/app/actions/transaction.integration.test.ts`
   - `src/lib/csv-parser.integration.test.ts`
   - `src/app/api/settlements/route.integration.test.ts`

3. **テスト内容（L-AS-001, L-AS-002準拠）**
   - API レスポンス形式の検証
   - 入力バリデーションエラーハンドリング
   - データベース操作の一貫性

## トラブルシューティング

### ワークフロー失敗時の対応

#### 1. static-analysis が失敗

- **原因:** lint, type-check, arch check, expressions check のいずれかが失敗
- **対応:**
  ```bash
  npm run lint
  npm run type-check
  npm run check:arch
  npm run check:expressions
  ```

#### 2. test-unit が失敗

- **原因:** ユニットテスト失敗 or カバレッジ80%未満
- **対応:**
  ```bash
  npm test -- --run --coverage
  # カバレッジレポート確認
  open coverage/index.html
  ```

#### 3. test-integration が失敗

- **原因:** 統合テスト未実装 or DBマイグレーション失敗
- **対応:**
  - 統合テスト未実装の場合: プレースホルダーで正常終了
  - DBエラーの場合: マイグレーションファイルを確認

#### 4. test-e2e が失敗

- **原因:** E2E, a11y, security テストのいずれかが失敗
- **対応:**
  ```bash
  npm run test:e2e
  npm run test:e2e:a11y
  npm run test:e2e:security
  ```

#### 5. build が失敗

- **原因:** ビルドエラー
- **対応:**
  ```bash
  npm run build
  ```

#### 6. laws-check が失敗

- **原因:** 上記いずれかのジョブが失敗
- **対応:** 失敗したジョブのログを確認し、個別に対応

## ブランチ保護設定

### 推奨設定

**必須ステータスチェック:**

- `Laws Compliance Summary` (laws-check.yml の最終ゲート)

**オプション（詳細確認用）:**

- `Static Analysis`
- `Unit Tests`
- `Integration Tests`
- `E2E Tests`
- `Build Verification`

### 設定手順

1. GitHub リポジトリ設定 → Branches
2. Branch protection rules → `master` (or `main`)
3. "Require status checks to pass before merging" を有効化
4. 検索ボックスで `Laws Compliance Summary` を追加
5. Save changes

## ロールバック手順

新ワークフローに問題がある場合の緊急対応:

1. **即座の対応:**

   ```bash
   # 新ワークフローを無効化
   git mv .github/workflows/laws-check.yml .github/workflows/laws-check.yml.disabled
   ```

2. **旧ワークフロー再有効化:**

   ```bash
   git revert <commit-hash>  # 削除コミットをrevert
   ```

3. **ブランチ保護設定を元に戻す:**
   - `CI` ワークフローを必須に戻す

## 成功指標

| 指標               | 目標  | 測定方法                      |
| ------------------ | ----- | ----------------------------- |
| CI実行時間（並列） | <60分 | GitHub Actions ダッシュボード |
| ワークフロー失敗率 | <5%   | 週次集計                      |
| Laws準拠率         | 100%  | laws-check.yml の結果         |
| 開発者満足度       | 向上  | 移行後アンケート              |

## よくある質問

### Q1: なぜ6つのワークフローに分割？

**A:** 観点ごとに分離することで:

- 失敗箇所の特定が容易
- 並列実行で高速化
- Laws準拠の明確化
- 保守性向上

### Q2: laws-check.yml は必須？

**A:** はい。全ワークフローの結果を集約し、Laws準拠の最終ゲートとして機能します。ブランチ保護で必須にしてください。

### Q3: 統合テストはいつ実装？

**A:** 新ワークフロー安定後、Week 3-4 で実装予定。現在はプレースホルダーで動作します。

### Q4: 既存ワークフローはいつ削除？

**A:** Week 2 の並行運用期間で問題なければ Week 3 で削除します。

### Q5: Lighthouse と Chromatic は？

**A:** Phase 2（Week 4以降）で test-e2e.yml に統合予定。現在は既存ワークフローを使用。

## 関連ドキュメント

- [Laws 一覧](./laws/README.md)
- [テスト戦略](./laws/07-test-audit.md)
- [CI設定詳細](./CI_CONSOLIDATION.md)
- [CLAUDE.md](../CLAUDE.md)
- [AGENTS.md](../AGENTS.md)

## 問い合わせ

問題が発生した場合:

1. このドキュメントのトラブルシューティングを確認
2. GitHub Actions のログを確認
3. Laws ドキュメントを確認
4. チームに相談

---

**更新日:** 2026-01-02
**バージョン:** 1.0
**ステータス:** Week 1 完了、Week 2 移行準備中
