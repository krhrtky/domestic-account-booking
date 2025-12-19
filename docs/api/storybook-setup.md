# Storybook & Chromatic VRT Setup

## 概要

Storybook v8とChromatic VRTを導入し、UI基盤コンポーネントのStoriesと表示フォーマットユーティリティを実装。

## 実装内容

### 1. Storybook v8.6導入

#### パッケージ
- `storybook@^8.6.15`
- `@storybook/nextjs@^8.6.15`
- `@storybook/addon-essentials@^8.6.14`
- `@storybook/addon-interactions@^8.6.14`
- `@storybook/test@^8.6.14`
- `chromatic@^12.2.0`

#### 設定ファイル
- `.storybook/main.ts`: Next.js統合設定
- `.storybook/preview.tsx`: グローバルスタイル適用

#### スクリプト
```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build",
"chromatic": "chromatic --exit-zero-on-changes"
```

### 2. L-CX-002準拠フォーマッター

#### `src/lib/formatters.ts`
- `formatCurrency(amount: number): string` - 金額を`¥{comma}`形式に
- `formatDate(date: Date | string, format?: 'long' | 'short'): string` - 日付を`YYYY年MM月DD日`または`YYYY/MM/DD`に
- `formatPercentage(value: number): string` - パーセンテージを`{number}%`に

#### `src/lib/formatters.test.ts`
- L-CX-002準拠を検証する10テストケース
- 全テストPASS

### 3. UI基盤コンポーネントStories

#### 作成済みStories
- `src/components/ui/FormField.stories.tsx` (6 stories)
- `src/components/ui/LoadingButton.stories.tsx` (7 stories)
- `src/components/ui/ErrorAlert.stories.tsx` (6 stories)
- `src/components/ui/LoadingSkeleton.stories.tsx` (4 stories)

#### Stories設計
- Default/WithValue/Required/WithErrorなど典型的な状態を網羅
- L-CX-003準拠の日本語エラーメッセージ例示
- Tailwind CSSクラスによるスタイリング

### 4. Chromatic VRT設定

#### `.github/workflows/chromatic.yml`
- master/PRでChromatic VRT実行
- `exitZeroOnChanges: true` - 変更検出でもCIを失敗させない
- `onlyChanged: true` - 変更されたStoriesのみテスト

#### 必要な環境変数
- `CHROMATIC_PROJECT_TOKEN`: GitHub Secrets設定が必要

## Laws準拠

### L-CX-002: UI表示の一貫性
- `formatCurrency`: ¥記号と3桁区切り
- `formatDate`: YYYY年MM月DD日形式
- `formatPercentage`: %記号付き

### L-CX-003: エラーメッセージの明確性
- ErrorAlert StoriesでL-CX-003準拠メッセージを例示

### L-OC-001: コーディング規約
- TypeScript strict mode準拠
- 既存コードスタイルに合わせた命名規則

## 実行コマンド

### Storybook起動
```bash
npm run storybook
```
http://localhost:6006 で起動

### ビルド
```bash
npm run build-storybook
```
`storybook-static/` にビルド成果物を出力

### Chromatic VRT
```bash
npm run chromatic
```

### テスト実行
```bash
npm test -- src/lib/formatters.test.ts
```

## 次のステップ

1. **Chromatic プロジェクト作成**
   - https://www.chromatic.com/ でプロジェクト作成
   - `CHROMATIC_PROJECT_TOKEN` をGitHub Secretsに登録

2. **追加コンポーネントStories作成**
   - `app/` 配下のページコンポーネントStories
   - ビジネスロジック統合したStories

3. **VRTベースライン設定**
   - 初回Chromatic実行でベースライン登録
   - PR毎の差分検出フロー確立
