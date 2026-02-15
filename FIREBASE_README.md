# Firebase とこのアプリの関係

## 1. 全体像

```
[ブラウザで開いたアプリ]  ←→  [Firebase プロジェクト: new-check-137f9]
                                    │
                                    ├── Authentication（匿名ログイン）
                                    └── Firestore（マスターデータの保存先）
```

- **Firebase プロジェクト**: `new-check-137f9`（コード内で固定）
- **データベース**: **Firestore**
- **認証**: 匿名認証（`signInAnonymously`）

---

## 2. Firestore のデータの場所（パス）

アプリが読み書きするデータは、すべて次のパス構造の下にあります。

```
Firestore
└── artifacts （コレクション）
    └── {データID（APP_ID）} （ドキュメント）
        └── public （サブコレクション）
            └── data （ドキュメント）
                └── 各マスター （サブコレクション）
                    ├── employees    （従業員）
                    ├── stores       （店舗）
                    ├── roles        （役職）
                    ├── fixtures     （什器）
                    ├── work_types   （作業種類）
                    ├── work_items   （作業項目）
                    ├── work_times   （作業時間）
                    ├── product_categories
                    ├── events
                    ├── skill_categories
                    ├── skill_checks
                    ├── toilet_cleaning
                    ├── handovers
                    └── haccp
```

**例**: データID が `general-master-data` のとき、従業員データのパスは  
`artifacts/general-master-data/public/data/employees` です。  
（Firebase コンソールで「artifacts → general-master-data → public → data」と表示されている場合、データID は **general-master-data** です。）

---

## 3. 「データID（App ID）」とは

- 画面上では **「初期設定」** モーダルの **「データID（App ID）」** で入力する値です。
- この値が **APP_ID** となり、上記の `artifacts/{APP_ID}/public/data/...` の **{APP_ID}** 部分になります。
- 初回や未設定のときは `localStorage` に保存されていないため、**初期設定モーダルが表示**されます。
- **データIDを間違えると、別のデータ（または空）を参照するため、何も表示されません。**

---

## 4. 何も表示されない主な理由

| 原因 | 確認・対処 |
|------|------------|
| **データIDが未設定** | 初期設定モーダルで「データID（App ID）」を入力し、「設定保存して開始」を押す。 |
| **データIDが違う** | Firestore に実際にデータがある「データID」を入力する。別アプリや Firebase コンソールで使っている ID と一致させる。 |
| **そのパスにデータがない** | `artifacts/{データID}/public/data/...` に、別アプリやコンソールからドキュメントが作成されていないと空のまま。 |
| **Firestore ルールで拒否** | Firebase コンソール → Firestore → ルールで、匿名ユーザーが `artifacts` 以下を読めるようになっているか確認する。 |

---

## 5. 確認の手順（推奨）

1. **Firebase コンソール**  
   https://console.firebase.google.com/  
   → プロジェクト **new-check-137f9** を開く。

2. **Firestore**  
   「Firestore Database」→「データ」タブで、  
   `artifacts` → その下の**ドキュメントID（これがデータID）** を確認する。

3. **アプリ側**  
   - アプリを開き、初期設定モーダルが出たら、上で確認した**データID**をそのまま入力する。  
   - すでに別の ID を入れている場合は、**正しいデータID** に変更して「設定保存して開始」を押す。

4. **まだ空の場合**  
   - このアプリは「マスター登録用」なので、  
     `artifacts/{データID}/public/data/` の各コレクションに、**別のチェックリストアプリなどでデータが作られている**前提の可能性があります。  
   - まずは店舗・役職など、どれか 1 つでも Firestore で手動でドキュメントを追加し、アプリでそのデータIDを指定して表示されるか試すとよいです。

---

## 6. まとめ

- **Firebase プロジェクト**: 固定で `new-check-137f9`。
- **データの場所**: Firestore の `artifacts/{データID}/public/data/{コレクション名}`。
- **表示される条件**:  
  「データID」が正しく、そのパスにデータがあり、かつ Firestore ルールで読み取りが許可されていること。

「何も表示されない」ときは、まず **データID** と **Firestore の artifacts 以下の構造** を上記の手順で確認してください。
