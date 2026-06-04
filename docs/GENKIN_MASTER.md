# 現金仕入マスタ（MASTER アプリ）

## Firestore パス

```
artifacts / general-master-data / public / data / genkin_vendors / {vendorId}
artifacts / general-master-data / public / data / genkin_vendor_products / {vendorId}__{productId}
```

現金仕入アプリ（CONV-GENKINSHIIRE-APP）と同じパスです。Data ID を変更しても、現金仕入マスタは常に `general-master-data` 固定です。

## 画面

| タブ | 用途 |
|------|------|
| 取引業者 | 業者名・連絡先・口座・手数料率（任意） |
| 現金仕入れ品目 | 業者選択・品目名・参考単価・手数料率（いずれも単価・手数料は任意） |

一覧・編集・削除は **マスタ管理** モーダルの同じタブから行います。

## フィールド

### 取引業者（genkin_vendors）

| フィールド | 必須 | 備考 |
|-----------|------|------|
| name | ○ | 現金仕入アプリのドロップダウン表示名 |
| phone, address | — | 任意 |
| bankName, bankBranch, bankAccountType, bankAccountNumber, bankAccountHolder | — | 口座（分割入力） |
| defaultCommissionRate | — | 例: 0.18。空なら保存しない |
| note | — | 備考 |

- ドキュメント ID: 自動 `vendor-prod-{...}`（画面非表示）

### 現金仕入れ品目（genkin_vendor_products）

| フィールド | 必須 | 備考 |
|-----------|------|------|
| vendorId | ○ | 登録時に業者を選択 |
| name | ○ | 品目名 |
| unitPriceYen | — | 参考単価（円）。現場アプリでも入力可 |
| defaultCommissionRate | — | 空なら業者の手数料率 |

- ドキュメント ID: `{vendorId}__prod-{...}`

## 削除

- 業者削除時は、紐づく品目もまとめて削除します。
- 入荷確認表（`genkin_sheets`）は削除しません。不要な表は Firebase コンソール等で整理してください。

## Firestore ルール

本番コンソールで `artifacts/.../genkin_vendors` と `genkin_vendor_products` の read/write を許可してください。
