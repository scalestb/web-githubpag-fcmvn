# Tra cuu the Panini

Website tinh dung HTML, CSS va JavaScript de tra cuu danh sach the theo so the, rarity, tu khoa va trang thai co the.

## Cau truc du lieu

- `data/seasons.json`: danh sach mua the.
- `data/cards.json`: danh sach the, gom `id`, `number`, `name`, `rarity`, `hasCard`, `imageUrl`, `shopeeLink`, `stock`, `totalInbound`, `totalOutbound`.
- `assets/cards/`: anh minh hoa cho tung the, uu tien ten file theo so the 3 chu so nhu `001.png`, `002.webp`.

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
