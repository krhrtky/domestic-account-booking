# フロントエンドデザイン改善 Issue一覧

> 参照: [Improving frontend design through Skills | Claude](https://claude.com/blog/improving-frontend-design-through-skills)

以下のIssueをGitHubで作成してください。各セクションのリンクをクリックすると、Issueの新規作成画面が開きます。

---

## Issue 1: 空間構成の刷新（Spatial Composition Refresh）

**優先度**: 高
**ラベル**: `enhancement`, `design`, `frontend`

### 作成リンク
[Create Issue](https://github.com/krhrtky/domestic-account-booking/issues/new?title=%5BDesign%5D+%E7%A9%BA%E9%96%93%E6%A7%8B%E6%88%90%E3%81%AE%E5%88%B7%E6%96%B0&labels=enhancement,design,frontend)

### 内容

```markdown
## 概要

現在の標準的なグリッドレイアウトから、より独自性のある空間構成に刷新する。

## 背景

[Improving frontend design through Skills](https://claude.com/blog/improving-frontend-design-through-skills) によると、AIが生成するUIは予測可能なレイアウトパターンに収束しがち。独自性のある空間構成により、ブランドアイデンティティを強化する。

## 改善内容

- [ ] Hero セクションの非対称レイアウト導入
- [ ] オフセットグリッド（意図的なズレ）の実装
- [ ] カード間のオーバーラップ効果
- [ ] 斜めの区切り線（diagonal dividers）の追加
- [ ] ネガティブスペースの戦略的活用

## 対象ファイル

- `src/components/landing/HeroSection.tsx`
- `src/components/landing/FeaturesSection.tsx`
- `src/components/settlement/SettlementDashboard.tsx`

## 受け入れ条件

- [ ] 少なくとも2つのセクションで非対称/オフセットレイアウトを適用
- [ ] レスポンシブ対応を維持
- [ ] Storybook でデザイン確認可能
```

---

## Issue 2: アニメーション・インタラクションの強化

**優先度**: 高
**ラベル**: `enhancement`, `design`, `frontend`, `ux`

### 作成リンク
[Create Issue](https://github.com/krhrtky/domestic-account-booking/issues/new?title=%5BDesign%5D+%E3%82%A2%E3%83%8B%E3%83%A1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E3%83%BB%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%A9%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3%E3%81%AE%E5%BC%B7%E5%8C%96&labels=enhancement,design,frontend,ux)

### 内容

```markdown
## 概要

既存の8種類のカスタムアニメーションをより積極的に活用し、ユーザー体験を向上させる。

## 背景

現在定義済みのアニメーション（fade-in-up, scale-in, float等）の使用箇所が限定的。高インパクトな瞬間（ページロード、ユーザーアクション）に集中したアニメーション設計が必要。

## 改善内容

### ページ遷移・ロード
- [ ] ページ遷移時のスムーズなアニメーション追加
- [ ] ダッシュボード要素の段階的表示（staggered animation）強化
- [ ] スクロール連動アニメーション（Intersection Observer活用）

### マイクロインタラクション
- [ ] ボタンクリック時のリップルエフェクト
- [ ] トグル切替時のスムーズな状態変化
- [ ] フォーム送信成功時のフィードバックアニメーション

### データ表示
- [ ] 数値変化時のカウントアップアニメーション（精算金額等）
- [ ] プログレスバーのアニメーション強化
- [ ] チャート/グラフ表示時のアニメーション

## 対象ファイル

- `app/globals.css` - 新規キーフレーム追加
- `tailwind.config.js` - アニメーション設定拡張
- `src/components/settlement/SettlementSummary.tsx`
- `src/components/ui/LoadingButton.tsx`

## 受け入れ条件

- [ ] 少なくとも3つの新しいインタラクションアニメーションを実装
- [ ] 既存アニメーションの使用箇所を2倍以上に拡大
- [ ] パフォーマンスへの影響を最小限に抑える（will-change活用）
```

---

## Issue 3: タイポグラフィ階層の強化

**優先度**: 中
**ラベル**: `enhancement`, `design`, `frontend`

### 作成リンク
[Create Issue](https://github.com/krhrtky/domestic-account-booking/issues/new?title=%5BDesign%5D+%E3%82%BF%E3%82%A4%E3%83%9D%E3%82%B0%E3%83%A9%E3%83%95%E3%82%A3%E9%9A%8E%E5%B1%A4%E3%81%AE%E5%BC%B7%E5%8C%96&labels=enhancement,design,frontend)

### 内容

```markdown
## 概要

見出しと本文のコントラストを強化し、より明確な視覚的階層を構築する。

## 背景

現在のタイポグラフィはフォントウェイトの変化が主な差別化要素。より大胆なサイズ設定と装飾的なアクセントにより、独自性を高める。

## 改善内容

### サイズ・スケール
- [ ] 見出しサイズを流体的に設定（clamp()関数活用）
- [ ] モバイル/デスクトップ間のサイズ差を拡大
- [ ] 数字表示の専用スタイル（金額表示等）

### レタースペーシング
- [ ] 見出し用のワイドなレタースペーシング定義
- [ ] 小見出し/ラベル用のトラッキング調整

### 装飾的要素
- [ ] アクセント下線（gradient underline）
- [ ] ハイライト効果（背景色付きテキスト）
- [ ] グラデーションテキスト（Hero見出し等）

## 対象ファイル

- `tailwind.config.js` - fontSize, letterSpacing拡張
- `app/globals.css` - カスタムテキストスタイル追加
- `src/components/landing/HeroSection.tsx`

## 受け入れ条件

- [ ] 3段階以上の明確な見出し階層（h1〜h3）を定義
- [ ] 少なくとも1つの装飾的テキストスタイルを実装
- [ ] 日本語フォントでの表示確認
```

---

## Issue 4: 視覚的差別化要素の追加

**優先度**: 中
**ラベル**: `enhancement`, `design`, `frontend`, `branding`

### 作成リンク
[Create Issue](https://github.com/krhrtky/domestic-account-booking/issues/new?title=%5BDesign%5D+%E8%A6%96%E8%A6%9A%E7%9A%84%E5%B7%AE%E5%88%A5%E5%8C%96%E8%A6%81%E7%B4%A0%E3%81%AE%E8%BF%BD%E5%8A%A0&labels=enhancement,design,frontend,branding)

### 内容

```markdown
## 概要

ブランドを記憶に残すための独自の視覚要素を追加する。

## 背景

AIが生成するUIは汎用的になりがち。特徴的なイラストスタイル、ローディング、空状態デザインにより、アプリケーションの個性を強化する。

## 改善内容

### カスタムイラスト/アイコン
- [ ] ブランドカラーを活かしたカスタムアイコンセット
- [ ] 空状態用のイラスト（取引なし、グループなし等）
- [ ] エラー状態用のフレンドリーなイラスト

### ローディング体験
- [ ] ブランドカラーのカスタムローディングスピナー
- [ ] スケルトンローディングのスタイル統一
- [ ] プログレス表示のカスタムデザイン

### ブランドパターン
- [ ] 背景に使える繰り返しパターン
- [ ] カードボーダーのアクセント装飾
- [ ] セクション区切りのカスタム要素

## 対象ファイル

- `src/components/ui/` - 新規UIコンポーネント
- `public/` - SVGアセット
- `app/globals.css` - パターン定義

## 受け入れ条件

- [ ] 少なくとも3つの空状態デザインを実装
- [ ] カスタムローディングアニメーションを1つ以上作成
- [ ] Ocean Trustカラーパレットと一貫性を保つ
```

---

## Issue 5: ダークモード対応

**優先度**: 中
**ラベル**: `enhancement`, `design`, `frontend`, `accessibility`

### 作成リンク
[Create Issue](https://github.com/krhrtky/domestic-account-booking/issues/new?title=%5BDesign%5D+%E3%83%80%E3%83%BC%E3%82%AF%E3%83%A2%E3%83%BC%E3%83%89%E5%AF%BE%E5%BF%9C&labels=enhancement,design,frontend,accessibility)

### 内容

```markdown
## 概要

ライトテーマに加えてダークテーマを実装し、ユーザーの好みやシステム設定に対応する。

## 背景

現在はライトテーマのみ。夜間利用時の目への負担軽減、バッテリー消費削減（OLED）、ユーザー選好への対応が必要。

## 改善内容

### テーマシステム
- [ ] CSS変数ベースのテーマ切替システム構築
- [ ] `prefers-color-scheme` メディアクエリ対応
- [ ] テーマ切替トグルUI実装
- [ ] LocalStorageでのテーマ設定保持

### ダークテーマカラーパレット
- [ ] Ocean Trustカラーのダーク版定義
- [ ] セマンティックカラーのダーク版調整
- [ ] 背景・テキストのコントラスト確保（WCAG AA）

### コンポーネント対応
- [ ] カード、入力フィールドのダークスタイル
- [ ] Glassmorphism効果のダーク版調整
- [ ] グラデーション背景のダーク版

## 対象ファイル

- `tailwind.config.js` - darkMode設定追加
- `app/globals.css` - ダークテーマ変数定義
- `app/layout.tsx` - テーマプロバイダー追加
- 全コンポーネント - dark:* クラス追加

## 受け入れ条件

- [ ] システム設定に連動したテーマ切替が動作
- [ ] 手動でのテーマ切替が可能
- [ ] 全ページでダークテーマが適切に表示
- [ ] コントラスト比がWCAG AA基準を満たす
```

---

## Issue 6: アクセシビリティ・パフォーマンス最適化

**優先度**: 低〜中
**ラベル**: `enhancement`, `accessibility`, `performance`

### 作成リンク
[Create Issue](https://github.com/krhrtky/domestic-account-booking/issues/new?title=%5BDesign%5D+%E3%82%A2%E3%82%AF%E3%82%BB%E3%82%B7%E3%83%93%E3%83%AA%E3%83%86%E3%82%A3%E3%83%BB%E3%83%91%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%B3%E3%82%B9%E6%9C%80%E9%81%A9%E5%8C%96&labels=enhancement,accessibility,performance)

### 内容

```markdown
## 概要

アクセシビリティ対応の強化とフロントエンドパフォーマンスの最適化を行う。

## 背景

現在もaria属性等の基本対応はあるが、モーション設定への配慮やパフォーマンス最適化の余地がある。

## 改善内容

### アクセシビリティ
- [ ] `prefers-reduced-motion` 対応（アニメーション無効化）
- [ ] カラーコントラスト比の検証・調整
- [ ] キーボードナビゲーションの強化
- [ ] スクリーンリーダー対応の検証

### パフォーマンス
- [ ] Google Fonts自己ホスティング化（next/font活用）
- [ ] 背景効果の条件付きレンダリング（低スペック端末対応）
- [ ] SVGノイズオーバーレイの最適化
- [ ] 画像の遅延読み込み設定

### 計測・監視
- [ ] Lighthouse Performanceスコア計測
- [ ] Core Web Vitals最適化
- [ ] バンドルサイズ分析

## 対象ファイル

- `app/layout.tsx` - フォント設定変更
- `app/globals.css` - reduced-motionメディアクエリ追加
- `next.config.js` - 画像最適化設定

## 受け入れ条件

- [ ] Lighthouse Accessibilityスコア90以上
- [ ] Lighthouse Performanceスコア80以上
- [ ] prefers-reduced-motion有効時にアニメーションが無効化
- [ ] フォントの自己ホスティング完了
```

---

## まとめ

| Issue | 優先度 | 主な効果 |
|-------|--------|----------|
| 1. 空間構成の刷新 | 高 | 視覚的差別化、AI的美学からの脱却 |
| 2. アニメーション強化 | 高 | UX向上、既存資産の活用 |
| 3. タイポグラフィ階層 | 中 | 可読性・情報階層の明確化 |
| 4. 視覚的差別化 | 中 | ブランド認知・記憶定着 |
| 5. ダークモード | 中 | ユーザー体験・アクセシビリティ |
| 6. A11y・パフォーマンス | 低〜中 | 包括的対応・品質向上 |

**参考資料:**
- [Improving frontend design through Skills | Claude](https://claude.com/blog/improving-frontend-design-through-skills)
- [Frontend Design Skill - GitHub](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
