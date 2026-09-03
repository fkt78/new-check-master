# 現金仕入マスタ（MASTER アプリ）

## Firestore パス

```
artifacts / general-master-data / public / data / genkin_vendors / {vendorId}
artifacts / general-master-data / public / data / genkin_products / {productId}
```

現金仕入アプリと同じパスです。Data ID を変更しても、現金仕入マスタは常に `general-master-data` 固定です。

## 画面

| タブ | 用途 |
|------|------|
| 取引業者 | 業者名・連絡先・口座・手数料率（任意） |
| 現金仕入れ品目 | **品目名の共通マスタ**（表記ゆれ防止。対象業者は任意） |

一覧・編集・削除は **マスタ管理** モーダルの同じタブから行います。

## 品目マスタの考え方

- 「お米2kg」「トマト」のように名称を統一するための共通マスタです。
- **対象業者（`vendorIds`）は任意。** 未選択（空配列）なら**全業者共通**で表示されます。1社以上チェックすると、**その業者だけ**の品目になります。
- 現金仕入アプリでは、業者を選ぶと、この共通マスタのうち「対象業者が空」または「対象業者にその業者が含まれる」品目だけが品目一覧・入荷確認表に使われます。
- 参考単価・手数料率は任意（現場アプリで変わる場合は空欄で登録可）。
- 現金仕入アプリ側には、業者ごとに共通マスタ品目を個別に非表示にする機能（`genkin_vendor_hidden_products`）も別途あります。対象業者を絞ればその機能を使わずに済みますが、既存の非表示設定と併用しても問題ありません。

## フィールド

### 取引業者（genkin_vendors）

| フィールド | 必須 | 備考 |
|-----------|------|------|
| name | ○ | ドロップダウン表示名 |
| phone, address | — | 任意 |
| bankName, bankBranch, bankAccountType, bankAccountNumber, bankAccountHolder | — | 口座（分割） |
| defaultCommissionRate | — | 例: 0.18 |
| note | — | 備考 |

- ドキュメント ID: 自動 `vendor-prod-{...}`

### 現金仕入れ品目（genkin_products）

| フィールド | 必須 | 備考 |
|-----------|------|------|
| name | ○ | 統一する品目名 |
| unitPriceYen | — | 参考単価（円） |
| defaultCommissionRate | — | 手数料率（任意） |
| vendorIds | — | 対象業者ID配列。空＝全業者共通、指定あり＝その業者のみ |

- ドキュメント ID: 自動 `prod-{...}`
- 同名が既にある場合は確認ダイアログを表示
- 既存品目（対象業者を選ばずに登録済みのもの）は `vendorIds: []` のまま＝引き続き全業者共通。編集モーダルからいつでも対象業者を絞り込める

## 削除

- 業者削除時は、**現場から追加した業者別品目**（`genkin_vendor_products`）のみ削除します。共通品目マスタは削除しません。
- 入荷確認表（`genkin_sheets`）は削除しません。

## Firestore ルール

本番で `genkin_vendors` と **`genkin_products`** の read/write を許可してください。
