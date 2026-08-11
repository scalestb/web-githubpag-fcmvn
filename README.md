# FCMVN Card Checklist

Website tinh dung HTML, CSS va JavaScript de tra cuu checklist cac dong san pham the.

## Tinh nang

- Danh sach checklist doc tu `data/list.json`.
- Moi checklist chi tiet nam trong `data/seasons/{checklist-id}.json`.
- Tra cuu theo so the, cau thu, CLB, card type, parallel type, serial numbered va autograph.
- Giao dien mobile-first, khong can build, khong can anh the tam thoi.
- Trang index co khu gioi thieu channel: Shopee, TikTok va YouTube.

## Cau truc du lieu

- `data/list.json`: registry cac dong san pham, gom `id`, `name`, `brand`, `collection`, `season`, `checklist_file` va thong ke tom tat.
- `data/seasons/*.json`: checklist tung dong san pham. Moi item co dang:

```json
{
  "card_number": "1",
  "player_name": "Rayan Cherki",
  "club": "Manchester City",
  "card_type": "BASE",
  "parallel_type": "Blue Foil",
  "is_numbered": true,
  "serial_limit": 150,
  "is_autograph": false
}
```

## Chay local

Trang dung `fetch()` de doc JSON, vi vay can chay qua static server. Khong mo truc tiep `index.html` bang `file://`.

### Cach nhanh tren Windows

Mo file `run-local.bat`, sau do vao:

```text
http://127.0.0.1:5501
```

### Chay bang command

```bash
python -m http.server 5501
```

Sau do mo `http://127.0.0.1:5501`.

## Dua len GitHub Pages

Day toan bo thu muc nay len repository GitHub, sau do bat Pages voi source la branch chua cac file nay. Khong can build.
