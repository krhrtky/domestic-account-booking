# Laws（開発ルール）

本ドキュメントは、家計精算アプリ開発における**絶対のルール**を定義する。

---

## 概要

### 目的

1. **ルールに則ったコーディング**: すべての実装はこのルールに準拠する
2. **ルールに則った検証**: テストでルール準拠を証明する
3. **検証のバイパス防止**: 検証内容と結果の論理的整合性を担保する

### ルールカテゴリ

| ID | カテゴリ | 目的 | ドキュメント |
|----|---------|------|-------------|
| L-CX | 顧客体験 | 誤案内・過剰約束・不適切表現を防ぐ | [01-customer-experience.md](./01-customer-experience.md) |
| L-RV | 収益・利益 | 値引き逸脱、条件ミス、見積もり齟齬を防ぐ | [02-revenue.md](./02-revenue.md) |
| L-LC | 法務・コンプラ | 個人情報、著作権、景表法違反を防ぐ | [03-legal-compliance.md](./03-legal-compliance.md) |
| L-SC | セキュリティ | 機密漏洩、インジェクション、権限逸脱を防ぐ | [04-security.md](./04-security.md) |
| L-OC | 組織の一貫性 | 判断の属人化、部門間齟齬を防ぐ | [05-organizational-consistency.md](./05-organizational-consistency.md) |

---

## ルール一覧

### 顧客体験 (L-CX)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-CX-001 | 精算金額の正確性 | 定義されたロジックに100%準拠 |
| L-CX-002 | UI表示の一貫性 | 金額・日付・ステータスのフォーマット統一 |
| L-CX-003 | エラーメッセージの明確性 | 具体的・対処可能・非技術的な表現 |
| L-CX-004 | 操作フィードバックの即時性 | 100ms以内のUI応答 |

### 収益・利益 (L-RV)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-RV-001 | 無料サービスの明示 | 課金機能の実装禁止 |
| L-RV-002 | インフラコストの制御 | リソース使用量の上限設定 |
| L-RV-003 | 将来の収益化への配慮 | スタブ・プレースホルダー禁止 |

### 法務・コンプラ (L-LC)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-LC-001 | 個人情報の適切な取り扱い | 収集データの最小化・保護 |
| L-LC-002 | データ保持期間の制限 | 3年/30日/90日の自動削除 |
| L-LC-003 | 著作権・商標の遵守 | ライセンス遵守・無断使用禁止 |
| L-LC-004 | 景品表示法への準拠 | 優良誤認表現の禁止 |

### セキュリティ (L-SC)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-SC-001 | 認証・認可の厳格化 | 全エンドポイントでの検証 |
| L-SC-002 | インジェクション対策 | サニタイズ・パラメータ化 |
| L-SC-003 | 機密情報の保護 | 環境変数管理・ログマスキング |
| L-SC-004 | レート制限とDoS対策 | エンドポイント別制限 |
| L-SC-005 | CSRFおよびセッション保護 | トークン必須・Cookie属性 |

### 組織の一貫性 (L-OC)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-OC-001 | コーディング規約の統一 | ESLint/Prettier/命名規則 |
| L-OC-002 | 精算ロジックの単一実装 | settlement.tsへの集約 |
| L-OC-003 | エラーハンドリングの統一 | カスタムエラークラス使用 |
| L-OC-004 | ドキュメント同期の強制 | API/ロジック変更時の更新 |
| L-OC-005 | ルールドキュメントの保護 | Agent編集禁止 |

---

## 検証体系

### テストレイヤー

```
┌─────────────────────────────────────────────┐
│                E2E Tests                     │ ← ユーザーシナリオ検証
├─────────────────────────────────────────────┤
│            Integration Tests                 │ ← API/コンポーネント結合
├─────────────────────────────────────────────┤
│              Unit Tests                      │ ← 個別関数・ロジック
├─────────────────────────────────────────────┤
│            Static Analysis                   │ ← 型チェック・Lint
└─────────────────────────────────────────────┘
```

### 各ルールの検証マッピング

| ルール | Unit | Integration | E2E | Static |
|--------|:----:|:-----------:|:---:|:------:|
| L-CX-001 | ✓ | ✓ | ✓ | - |
| L-CX-002 | ✓ | - | ✓ | - |
| L-CX-003 | ✓ | - | ✓ | - |
| L-CX-004 | - | - | ✓ | - |
| L-RV-001 | - | - | - | ✓ |
| L-RV-002 | ✓ | ✓ | - | - |
| L-SC-001 | - | ✓ | ✓ | - |
| L-SC-002 | ✓ | - | - | ✓ |
| L-SC-003 | ✓ | - | - | ✓ |
| L-OC-001 | - | - | - | ✓ |
| L-OC-002 | - | - | - | ✓ |

---

## CI/CD統合

### GitHub Actions ワークフロー

```yaml
# .github/workflows/laws-validation.yml

name: Laws Validation

on: [push, pull_request]

jobs:
  validate-all-laws:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      # Static Analysis
      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Check secrets
        run: npx ts-node scripts/check-secrets.ts

      - name: Check licenses
        run: npx license-checker --failOn "GPL;AGPL"

      - name: Check no payment code
        run: npx ts-node scripts/check-no-payment.ts

      # Unit Tests
      - name: Run unit tests
        run: npm test -- --coverage

      # Integration Tests
      - name: Run integration tests
        run: npm run test:integration

      # E2E Tests
      - name: Run E2E tests
        run: npm run test:e2e

      # Report
      - name: Generate coverage report
        run: npm run coverage:report

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 必須チェック設定

```yaml
# リポジトリ設定: Branch protection rules
required_status_checks:
  - "validate-all-laws"

required_reviewers: 1

dismiss_stale_reviews: true
```

---

## Coding Agent向け指示

### 禁則事項

1. **docs/laws/ 配下のファイル編集禁止**
2. ルール衝突発見時は実装中断してユーザーに報告
3. ルール不在発見時は実装中断してユーザーに報告

### 報告テンプレート

```markdown
⚠️ ルール問題検出

種別: [衝突|不在|適用不能]
該当ルール: L-XX-NNN
状況: [具体的な説明]
影響: [実装への影響]
提案: [可能であれば解決案]
```

### ルール参照方法

実装時は以下のコマンドでルールを確認：

```bash
# 特定カテゴリのルール確認
cat docs/laws/01-customer-experience.md

# 全ルール一覧
cat docs/laws/README.md
```

---

## 変更履歴

| 日付 | 変更内容 | 変更者 |
|------|---------|--------|
| 2025-01-XX | 初版作成 | - |
