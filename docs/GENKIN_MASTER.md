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
| 現金仕入れ品目 | **品目名の共通マスタ**（表記ゆれ防止。業者の選択は不要） |

一覧・編集・削除は **マスタ管理** モーダルの同じタブから行います。

## 品目マスタの考え方

- **業者に紐づけません。** 「お米2kg」「トマト」のように名称を全店・全業者で共通利用します。
- 現金仕入アプリでは、業者を選ぶと **この共通マスタの品目一覧** が品目ドロップダウン・入荷確認表に使われます。
- 参考単価・手数料率は任意（現場アプリで変わる場合は空欄で登録可）。

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

- ドキュメント ID: 自動 `prod-{...}`
- 同名が既にある場合は確認ダイアログを表示

## 削除

- 業者削除時は、**現場から追加した業者別品目**（`genkin_vendor_products`）のみ削除します。共通品目マスタは削除しません。
- 入荷確認表（`genkin_sheets`）は削除しません。

## Firestore ルール

本番で `genkin_vendors` と **`genkin_products`** の read/write を許可してください。
