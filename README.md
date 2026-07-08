# Tra cuu the Panini

Website tinh dung HTML, CSS va JavaScript de tra cuu danh sach the theo mua, rarity, tu khoa va ton kho.

## Cau truc du lieu

- `data/seasons.json`: danh sach mua the.
- `data/cards.json`: danh sach the, gom `seasonId`, `code`, `name`, `team`, `image`, `rarity`, `stock`.
- `assets/cards/`: anh minh hoa cho tung the.

## Chay local

Trang dung `fetch()` de doc JSON, vi vay can chay qua static server. Khong mo truc tiep `index.html` bang `file://`, vi trinh duyet se chan JavaScript doc cac file JSON trong thu muc `data/`.

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
