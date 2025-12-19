# E2Eテスト失敗に関するポストモーテム

**作成日:** 2025-12-15
**インシデント:** UI日本語化後のE2Eテスト不整合

---

## 1. 概要

UI日本語化（L-CX-003準拠）実施後、E2Eテストが英語の期待値のまま残り、テスト失敗を引き起こした。

## 2. 影響範囲

### 失敗したテスト
| テストファイル | 行 | 期待値（英語） | 実際の値（日本語） |
|---------------|-----|---------------|-------------------|
| `e2e/auth/login.spec.ts` | 68 | `'Logging in...'` | `'ログイン中...'` |
| `e2e/demo/04-csv-upload.spec.ts` | 56 | `'Upload'` | `'CSVをアップロード'` |
| `e2e/demo/09-settlement-equal.spec.ts` | 80 | `/User B pays.*Settlement User/` | `ユーザーBが...に...を支払う` |
| `e2e/demo/10-settlement-unequal.spec.ts` | - | 同上 | 同上 |
| `e2e/demo/11-settlement-common-account.spec.ts` | - | 同上 | 同上 |

## 3. 根本原因分析

### 直接原因
- UI日本語化実施時に、対応するE2Eテストを更新しなかった

### 根本原因
1. **影響範囲分析の不足**
   - UIテキスト変更がE2Eテストに影響することを予測できていなかった
   - 変更箇所をGrepで検索する手順がなかった

2. **E2Eテスト実行のスキップ**
   - COMPLIANCE-REPORTで「DB setup課題によりE2E実行は未完了」と記載
   - DBの問題を理由にE2Eテスト実行確認を省略した

3. **完了判断基準の曖昧さ**
   - 「テスト追加」と「テスト更新」を混同
   - E2Eテスト実行が完了条件に明記されていなかった

## 4. Laws準拠状況

### 直接的な違反なし
- L-CX-003: UIは正しく日本語化されている（準拠）

### 間接的な違反
- L-TA-001: テストと実装の乖離（テストが仕様として機能していない）
- L-TA-002: E2Eテストのパス条件未達

## 5. 再発防止策

### 5.1 プロセス改善

#### UIテキスト変更時のチェックリスト
UIのテキストを変更する際は以下を必須とする:

```markdown
## UI日本語化/テキスト変更 チェックリスト

- [ ] 変更対象のテキストをGrepで検索
  - `grep -r "変更前のテキスト" e2e/`
- [ ] 該当するE2Eテストファイルを特定
- [ ] E2Eテストの期待値を更新
- [ ] E2Eテストをローカルで実行して確認
  - `make e2e-local`
```

#### 完了条件の明確化
以下をすべて満たさない限り「完了」と判断しない:

1. **単体テスト**: `npm test` 全パス
2. **型チェック**: `npm run typecheck` エラーなし
3. **リント**: `npm run lint` エラーなし
4. **E2Eテスト**: `make e2e-local` 全パス（または明確な理由のある失敗のみ）

### 5.2 技術的改善

#### E2Eテストの国際化対応検討
将来的に、E2Eテストで使用するテキストを定数化または外部化:

```typescript
// e2e/constants/ui-texts.ts
export const UI_TEXTS = {
  auth: {
    loggingIn: 'ログイン中...',
    loginFailed: 'ログインに失敗しました',
  },
  csv: {
    uploadButton: 'CSVをアップロード',
  },
  settlement: {
    payPattern: (payer: string, payee: string, amount: string) =>
      `${payer}が${payee}に${amount}を支払う`,
  },
}
```

### 5.3 レビュー強化

#### PRレビュー時の確認項目追加
UIテキスト変更を含むPRでは:
- [ ] 対応するE2Eテストの更新が含まれているか確認
- [ ] E2Eテスト実行結果のスクリーンショット/ログを確認

## 6. 修正計画

### 即時対応
1. `e2e/auth/login.spec.ts` - 期待値を日本語に更新
2. `e2e/demo/04-csv-upload.spec.ts` - 期待値を日本語に更新
3. `e2e/demo/09-settlement-equal.spec.ts` - 期待値を日本語に更新
4. `e2e/demo/10-settlement-unequal.spec.ts` - 期待値を日本語に更新
5. `e2e/demo/11-settlement-common-account.spec.ts` - 期待値を日本語に更新
6. その他影響を受けるテストファイルの修正

### 検証
- `make e2e-local` を実行し、全テストがパスすることを確認

## 7. 学んだ教訓

1. **「動くコード」だけでは不十分** - テストも含めて動作することが完了条件
2. **ブロッカーは解決するもの** - DBの問題を理由にテストをスキップしてはいけない
3. **影響範囲は事前に調査** - 変更前に`grep`で関連箇所を洗い出す

---

**Document Version:** 1.0
**Author:** Claude Code (Analysis Agent)
**Status:** In Progress → Remediation
