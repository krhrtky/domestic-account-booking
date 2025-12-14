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
| L-CN | 基本原則 | データ分類・事故定義・AI利用ポリシー | [00-constitution.md](./00-constitution.md) |
| L-CX | 顧客体験 | 誤案内・過剰約束・不適切表現を防ぐ | [01-customer-experience.md](./01-customer-experience.md) |
| L-RV | 収益・利益 | 値引き逸脱、条件ミス、見積もり齟齬を防ぐ | [02-revenue.md](./02-revenue.md) |
| L-LC | 法務・コンプラ | 個人情報、著作権、景表法違反を防ぐ | [03-legal-compliance.md](./03-legal-compliance.md) |
| L-SC | セキュリティ | 機密漏洩、インジェクション、権限逸脱を防ぐ | [04-security.md](./04-security.md) |
| L-OC | 組織の一貫性 | 判断の属人化、部門間齟齬を防ぐ | [05-organizational-consistency.md](./05-organizational-consistency.md) |
| L-AS | API仕様 | レスポンス形式・バリデーション・ヘッダー | [06-api-specification.md](./06-api-specification.md) |
| L-TA | テスト・監査 | 評価データセット・ルーブリック・監査ログ | [07-test-audit.md](./07-test-audit.md) |
| L-BR | 業務ルール | 精算計算・支出分類・月次集計・トレーサビリティ | [08-business-rules.md](./08-business-rules.md) |

---

## ルール一覧

### 基本原則 (L-CN)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-CN-001 | データ分類体系 | 公開/社内限定/機密/個人情報の4段階分類 |
| L-CN-002 | 重大事故の定義 | P0-P3レベル定義・エスカレーションフロー |
| L-CN-003 | AI/エージェント利用ポリシー | Coding Agent制限・将来AI機能の予約 |
| L-CN-004 | ガバナンス構造 | ルール階層・衝突時の優先順位 |

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
| L-LC-004 | 禁止表現リスト | 優良誤認・差別的・煽り表現の網羅的禁止 |
| L-LC-005 | 機能の禁止領域 | 税務/投資/法務助言・自動意思決定の禁止 |

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

### API仕様 (L-AS)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-AS-001 | レスポンス標準フォーマット | success/data/error構造の統一 |
| L-AS-002 | 入力バリデーション仕様 | Zodスキーマによる検証 |
| L-AS-003 | エンドポイント仕様 | API一覧・パラメータ定義 |
| L-AS-004 | レスポンスヘッダー仕様 | 必須/セキュリティ/禁止ヘッダー |

### テスト・監査 (L-TA)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-TA-001 | 評価データセット | 典型/境界/事故/グレー/攻撃ケースの分類 |
| L-TA-002 | 採点ルーブリック | 合格基準・カバレッジ閾値 |
| L-TA-003 | レッドチームシナリオ | 認証/インジェクション/漏洩攻撃集 |
| L-TA-004 | 監査ログ設計 | ログスキーマ・マスキングルール |
| L-TA-005 | 評価データセットの要件検証 | データセット自体の品質・整合性検証 |

### 業務ルール (L-BR)

| ID | ルール名 | 概要 |
|----|---------|------|
| L-BR-001 | 精算計算ルール | シンプルモデル・端数処理・負担割合制約 |
| L-BR-002 | 支払元（Payer）ルール | UserA/UserB/Commonの定義と計算影響 |
| L-BR-003 | 支出タイプ（ExpenseType）ルール | Household/Personalの分類ガイドライン |
| L-BR-004 | 月次集計ルール | 集計期間・タイムゾーン・月またぎ |
| L-BR-005 | グループ管理ルール | 招待フロー・メンバー制限 |
| L-BR-006 | CSV取り込みルール | フォーマット・列マッピング・重複検知 |
| L-BR-007 | 根拠トレーサビリティ | 精算金額の内訳表示・監査ユースケース |

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

| ルール | Unit | Integration | E2E | Static | RedTeam |
|--------|:----:|:-----------:|:---:|:------:|:-------:|
| L-CN-001 | ✓ | - | - | ✓ | - |
| L-CN-002 | ✓ | - | ✓ | - | - |
| L-CN-003 | - | - | - | ✓ | - |
| L-CX-001 | ✓ | ✓ | ✓ | - | - |
| L-CX-002 | ✓ | - | ✓ | - | - |
| L-CX-003 | ✓ | - | ✓ | - | - |
| L-CX-004 | - | - | ✓ | - | - |
| L-RV-001 | - | - | - | ✓ | - |
| L-RV-002 | ✓ | ✓ | - | - | - |
| L-LC-004 | - | - | - | ✓ | - |
| L-LC-005 | - | - | - | ✓ | - |
| L-SC-001 | - | ✓ | ✓ | - | ✓ |
| L-SC-002 | ✓ | - | - | ✓ | ✓ |
| L-SC-003 | ✓ | - | - | ✓ | ✓ |
| L-AS-001 | ✓ | ✓ | - | - | - |
| L-AS-002 | ✓ | - | - | - | - |
| L-AS-003 | - | ✓ | ✓ | - | - |
| L-AS-004 | - | ✓ | - | - | - |
| L-TA-001 | ✓ | - | - | - | - |
| L-TA-004 | ✓ | - | - | - | - |
| L-TA-005 | ✓ | - | - | - | - |
| L-OC-001 | - | - | - | ✓ | - |
| L-OC-002 | - | - | - | ✓ | - |
| L-BR-001 | ✓ | ✓ | ✓ | - | - |
| L-BR-003 | ✓ | - | - | - | - |
| L-BR-006 | ✓ | ✓ | - | - | - |
| L-BR-007 | - | - | ✓ | - | - |

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
| 2025-12-14 | 初版作成（L-CX, L-RV, L-LC, L-SC, L-OC） | - |
| 2025-12-14 | 基本原則（L-CN）追加 | - |
| 2025-12-14 | API仕様（L-AS）追加 | - |
| 2025-12-14 | テスト・監査（L-TA）追加 | - |
| 2025-12-14 | L-LC-004拡張（禁止表現リスト網羅化） | - |
| 2025-12-14 | L-LC-005追加（機能の禁止領域） | - |
| 2025-12-14 | 業務ルール（L-BR）追加 | - |
| 2025-12-14 | L-TA-005追加（評価データセットの要件検証） | - |
| 2025-12-14 | L-CN-003からAI予約定義を削除 | - |
| 2025-12-14 | L-BR-007追加（根拠トレーサビリティ監査要件） | - |
