開発を行うAIエージェント（CursorやWindsurf、あるいは社内のエンジニア）にそのまま渡すことで、迷いなく設計・実装に入れるレベルの「プロダクト要件定義書（PRD）」を作成しました。

このプロンプトをコピーして、AIエージェントの冒頭のコンテキストとして与えてください。

---

# Product Requirement Document: 家計・立替精算アプリ (Project Name: Household Settlement)

## 1. プロジェクト概要 (Project Overview)
共働き夫婦や同棲カップルをターゲットとした、家計簿および立替精算アプリケーション。
各個人のクレジットカードや銀行口座の明細（CSV）を取り込み、「個人の支出」か「家計の支出（共有）」かを仕分けることで、月末に「どちらが誰にいくら支払うべきか」を自動算出する。
既存アプリの課題である「細かい按分計算の手間」を解消し、心理的・作業的コストを下げることを目的とする。

## 2. ターゲットユーザー (Target Audience)
* **属性:** 共働き夫婦、同棲カップル。
* **特徴:**
    * 財布（銀行口座・カード）は基本的に別々である。
    * 家賃や食費などの共通経費のために「共通口座」を持っている場合もある。
    * 負担割合は必ずしも 50:50 ではなく、収入に応じた比率（例: 60:40）の場合がある。
* **課題:** 「これ私の服」「これ二人の夕飯」といった明細ごとの仕分けと、その後の電卓計算が面倒。

## 3. コアコンセプトと用語定義 (Core Concepts)
* **Payer (支払元):** 誰の財布からお金が出たか。
    * `User A` (個人)
    * `User B` (個人)
    * `Common` (共通口座)
* **Expense Type (支出タイプ):** その支出は誰のためのものか。
    * `Household` (家計・共有): 二人で分担すべき費用。
    * `Personal` (個人): 個人の趣味や嗜好品。分担対象外。
* **Ratio (負担割合):** 家計支出を負担する比率（例: A 60% : B 40%）。

## 4. 機能要件 (Functional Requirements)

### Phase 1: MVP Scope

#### Epic 1: ユーザー管理 & グループ (User & Group)
* ユーザーはアカウント登録ができる。
* ユーザーはパートナーを招待し、1つの「家計グループ」を形成できる。
* グループ設定として「負担割合 (Income Ratio)」を設定できる（デフォルト 50:50）。

#### Epic 2: データ取り込み (Data Ingestion)
* ユーザーはクレジットカードや銀行の明細CSVファイルをアップロードできる。
* アップロード時、そのCSVが「誰の（どの）支払元か」を選択する（User A / User B / Common）。
* **重要:** API連携はPhase 1では実装せず、CSVインポートのみとする。

#### Epic 3: 明細仕分け (Classification)
* 取り込まれた明細リストを表示する。
* 各明細に対し、ユーザーは `Household` (家計) か `Personal` (個人) のフラグを変更できる。
    * デフォルト値はインポート時に仮決めするが、手動変更を正とする。
* 明細の削除・除外ができる。

#### Epic 4: 精算ロジック (Settlement Logic)
* 指定した対象月（例: 2025-01）の集計結果を表示する。
* 以下の計算ロジックに基づき、「誰が誰にいくら支払うか」の最終数値を表示する。
* 精算の「完了/未完了」のステータス管理機能は不要（結果表示のみで良い）。

---

## 5. 精算ロジック詳細 (Business Logic)

このアプリケーションの核心部分であるため、厳密に実装すること。

**定義:**
* $TotalHousehold$: タイプが `Household` である支出の総額。
* $Ratio_A$: ユーザーAの負担率（例: 0.6）。
* $Ratio_B$: ユーザーBの負担率（例: 0.4）。
* $PaidBy_A^{Household}$: ユーザーAの個人財布から支払われた `Household` 経費の合計。
* $PaidBy_B^{Household}$: ユーザーBの個人財布から支払われた `Household` 経費の合計。
* $PaidBy_{Common}^{Personal}$: 共通口座から支払われたが、実は `Personal` だった支出（Aの無駄遣いなど）の合計。

**計算式 (ユーザーA視点の収支):**

ユーザーAが受け取るべき金額 $Settlement_A$ は以下の要素で構成される。

1.  **立替精算分:** Aが立て替えた家計費から、Aの本来の負担額を引く。
    $$(PaidBy_A^{Household}) - (TotalHousehold \times Ratio_A)$$
    *(共通口座からの支払いは、既に二人の資金プールから出ているため、ここの「立替」計算には含めない)*

2.  **共通口座の私的利用調整 (Advanced):**
    もし共通口座で個人の買い物をした場合、その分を精算に含める（相手に戻す、またはプールに戻す概念だが、簡易的に相手への支払いに上乗せして調整する）。
    * Aが共通口座で個人利用した場合: Aは資金プールに返済義務がある。
    * Bが共通口座で個人利用した場合: Bは資金プールに返済義務がある。

    *※MVPでは複雑さを避けるため、「共通口座で個人の買い物をした」ケースは一旦計算外（運用回避）とするか、あるいは単純に「共通口座からの支出は常にHousehold扱い（Personalにはできない）」という制約を設けても良い。*
    *→ 今回は**「共通口座からの支出でもPersonalラベル付けは可能」**とし、その場合は「その個人が、共通口座（実質的には相手の持分含む）に対して借金をした」とみなし、精算額に加算するロジックを採用する。*

**最終的な精算額 (AがBに払う額):**
計算結果がプラスなら「AがBから受け取る」、マイナスなら「AがBに支払う」。

$$Amount = (PaidBy_A^{Household} - TotalHousehold \times Ratio_A) - (共通口座からのAの個人利用額/2) + (共通口座からのBの個人利用額/2)$$
※共通口座の原資が50:50で入金されている前提の簡易補正。

**【推奨シンプルロジック】**
MVPでは混乱を避けるため、以下の最もシンプルなモデルを採用してください。

$$Balance_A = PaidBy_A^{Household} - ( (PaidBy_A^{Household} + PaidBy_B^{Household}) \times Ratio_A )$$

* もし $Balance_A > 0$: BはAに $Balance_A$ を支払う。
* もし $Balance_A < 0$: AはBに $|Balance_A|$ を支払う。
* **注記:** `Common` (共通口座) からの支払いは、この計算式（個人の立替精算）には影響しないものとして除外する。（共通口座の残高は減るが、個人間の貸し借りではないため）

---

## 6. データモデル案 (Database Schema Draft)

実装時は以下のリレーションを想定する。

**Users**
* `id`: UUID
* `name`: String
* `email`: String
* `group_id`: FK -> Groups

**Groups**
* `id`: UUID
* `name`: String
* `ratio_a`: Float (e.g., 60)
* `ratio_b`: Float (e.g., 40)

**Transactions**
* `id`: UUID
* `group_id`: FK -> Groups
* `date`: Date
* `amount`: Integer
* `description`: String
* `payer_type`: Enum (`UserA`, `UserB`, `Common`)
* `expense_type`: Enum (`Household`, `Personal`)
* `source_file_id`: String (CSV管理用)

---

## 7. 非機能要件・技術スタック推奨 (Tech Stack Recommendation)

* **Frontend:** Next.js (React), TypeScript, Tailwind CSS
* **Backend/DB:** Supabase (PostgreSQL) or Firebase
    * *Reason:* 認証(Auth)とDB構築が高速で、MVP開発に最適。
* **Deployment:** Vercel
* **UI/UX:**
    * モバイルファースト（スマホブラウザでの利用を想定）。
    * 明細仕分けは「スワイプ」または「一覧でのトグルスイッチ」など、高速に操作できるUIであること。

---

## 8. 開発者への指示 (Instructions for Developer)

1.  まずは **Database Schema** を構築し、CSVアップロードを受け入れるAPI (またはServer Action) を作成してください。
2.  次に、**明細一覧画面** を作成し、`expense_type` を高速に切り替えるUIを実装してください。
3.  最後に、**「5. 精算ロジック詳細」の【推奨シンプルロジック】** を使用して、指定月の精算額を表示するダッシュボードを作成してください。
