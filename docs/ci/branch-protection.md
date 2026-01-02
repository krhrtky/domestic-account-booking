# ブランチ保護設定更新手順

## 実施タイミング

**Week 2 Day 6（2026年1月8日）**

新ワークフローが5日間安定稼働したことを確認後に実施。

## 前提条件

以下の条件を全て満たしていること:

- [ ] 新ワークフロー成功率 ≥ 95%
- [ ] 平均実行時間 < 60分
- [ ] flaky率 < 2%
- [ ] 全Laws検証が正常動作
- [ ] 重大バグ 0件

## 現在の設定（変更前）

### 必須ステータスチェック

| ワークフロー | ジョブ名             | 廃止予定        |
| ------------ | -------------------- | --------------- |
| CI           | Lint & Type Check    | ✅ Week 3で廃止 |
| CI           | Unit Tests           | ✅ Week 3で廃止 |
| CI           | Build                | ✅ Week 3で廃止 |
| E2E Tests    | lint                 | ✅ Week 3で廃止 |
| E2E Tests    | test (auth-and-demo) | ⚠️ 暫定継続     |
| E2E Tests    | test (app)           | ⚠️ 暫定継続     |

## 新しい設定（変更後）

### 必須ステータスチェック

**最小構成（推奨）:**

- ✅ `Laws Compliance Summary` (laws-check.yml)

**詳細構成（オプション）:**

- ✅ `Laws Compliance Summary` (laws-check.yml)
- ✅ `Static Analysis` (static-analysis.yml)
- ✅ `Unit Tests` (test-unit.yml)
- ✅ `Integration Tests` (test-integration.yml)
- ✅ `E2E Tests (typical-auth-demo)` (test-e2e.yml)
- ✅ `E2E Tests (typical-settlement)` (test-e2e.yml)
- ✅ `Accessibility Tests` (test-e2e.yml)
- ✅ `Security Tests (L-TA-003 Red Team)` (test-e2e.yml)
- ✅ `Build Verification` (build.yml)

## 更新手順

### ステップ1: GitHub設定画面を開く

1. GitHubリポジトリページを開く
2. **Settings** タブをクリック
3. 左メニューから **Branches** を選択
4. `master` (または `main`) ブランチの **Edit** ボタンをクリック

### ステップ2: 必須ステータスチェックを更新

#### A. 旧ワークフローを削除

以下のチェックを**外す**:

- [ ] `Lint & Type Check` (CI)
- [ ] `Unit Tests` (CI)
- [ ] `Build` (CI)
- [ ] `lint` (E2E Tests)

#### B. 新ワークフローを追加

**最小構成の場合:**

検索ボックスで以下を検索して追加:

- [x] `Laws Compliance Summary`

**詳細構成の場合:**

検索ボックスで以下を順次検索して追加:

- [x] `Laws Compliance Summary`
- [x] `Static Analysis`
- [x] `Unit Tests`
- [x] `Integration Tests`
- [x] `E2E Tests (typical-auth-demo)`
- [x] `E2E Tests (typical-settlement)`
- [x] `Accessibility Tests`
- [x] `Security Tests (L-TA-003 Red Team)`
- [x] `Build Verification`

### ステップ3: その他の設定確認

以下の設定が有効になっていることを確認:

- [x] **Require status checks to pass before merging**: 有効
- [x] **Require branches to be up to date before merging**: 有効
- [x] **Require conversation resolution before merging**: 推奨（任意）
- [x] **Require approvals**: 1人以上（推奨）
- [x] **Dismiss stale pull request approvals when new commits are pushed**: 推奨

### ステップ4: 保存

**Save changes** ボタンをクリック

### ステップ5: 動作確認

テストPRを作成して確認:

```bash
# テストブランチ作成
git checkout -b test/branch-protection-update
echo "# Test" >> README.md
git add README.md
git commit -m "test: ブランチ保護設定テスト"
git push origin test/branch-protection-update

# PRを作成
gh pr create --title "Test: Branch Protection Update" --body "新しいブランチ保護設定のテスト"
```

**確認項目:**

- [ ] PR画面で「Laws Compliance Summary」チェックが必須になっている
- [ ] laws-check.yml ワークフローが自動実行される
- [ ] 全ジョブが成功するとマージ可能になる
- [ ] ジョブが失敗するとマージがブロックされる

### ステップ6: テストPRをクリーンアップ

```bash
gh pr close <pr-number>
git checkout master
git branch -D test/branch-protection-update
git push origin --delete test/branch-protection-update
```

## ロールバック手順

問題が発生した場合の緊急対応:

### 即座の対応（5分以内）

1. GitHub Settings → Branches → master → Edit
2. 新しいステータスチェックを全て削除
3. 旧ステータスチェックを再度追加:
   - `Lint & Type Check`
   - `Unit Tests`
   - `Build`
4. Save changes

### 根本対応（1時間以内）

1. 問題の原因を特定
2. 修正PRを作成
3. 修正確認後、再度ブランチ保護設定を更新

## トラブルシューティング

### Q1: 「Laws Compliance Summary」が見つからない

**原因:** ワークフローがまだ実行されていない

**対応:**

1. masterブランチで一度laws-check.ymlを実行
2. 実行後、GitHub UIで選択可能になる

### Q2: PRでステータスチェックが表示されない

**原因:** ワークフローのトリガー設定が不正

**対応:**

1. `.github/workflows/laws-check.yml` の `on:` セクションを確認
2. `pull_request` トリガーが含まれているか確認
3. 含まれていない場合は追加して再プッシュ

### Q3: 旧ワークフローも実行されている

**原因:** 旧ワークフローがまだ有効

**対応:**

- Week 2期間中は意図的に並行稼働させている
- Week 3で旧ワークフローを削除予定
- 現時点では問題なし

### Q4: 特定のジョブだけ頻繁に失敗する

**原因:** flaky test または環境問題

**対応:**

1. CI_WEEK2_MONITORING.md の「失敗パターン分析」を実施
2. flaky率が2%以上ならWeek 2延長を検討
3. 修正PRを優先的に作成

## 設定例（スクリーンショット代替テキスト）

### Require status checks to pass before merging

```
☑ Require status checks to pass before merging
  Status checks found in the last week for this repository

  🔍 Search for status checks
  ☑ Laws Compliance Summary
  ☑ Static Analysis
  ☑ Unit Tests
  ☑ Integration Tests
  ☑ E2E Tests (typical-auth-demo)
  ☑ E2E Tests (typical-settlement)
  ☑ Accessibility Tests
  ☑ Security Tests (L-TA-003 Red Team)
  ☑ Build Verification

  ☑ Require branches to be up to date before merging
```

## チェックリスト

### 実施前

- [ ] Week 2 Day 5の監視レポート確認
- [ ] 成功率 ≥ 95% を確認
- [ ] flaky率 < 2% を確認
- [ ] Laws準拠チェックリスト全て完了を確認
- [ ] チームに事前通知（30分前）

### 実施中

- [ ] ステップ1-6を順次実施
- [ ] 各ステップでスクリーンショット取得（記録用）
- [ ] テストPRで動作確認
- [ ] 問題なければテストPRをクローズ

### 実施後

- [ ] チームに完了通知
- [ ] 次のPRで新設定が適用されることを確認
- [ ] 問題があれば即座にロールバック
- [ ] Week 2 Day 7の最終確認に記録

## 関連ドキュメント

- [CI移行計画](./CI_MIGRATION_PLAN.md)
- [Week 2監視ガイド](./CI_WEEK2_MONITORING.md)
- [GitHub Docs: Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

**更新日:** 2026-01-02
**実施予定日:** 2026-01-08
**担当者:** [チーム名/担当者名]
**ステータス:** Week 2 Day 6 準備完了
