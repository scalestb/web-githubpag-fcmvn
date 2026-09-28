# FCMVN - Cẩm nang football trading card

Website tĩnh cho cộng đồng sưu tầm football trading card Việt Nam. Site không còn là landing page một trang dài; nội dung đã tách thành các page con thật để phù hợp GitHub Pages và dễ mở rộng bài viết.

## Cấu trúc trang

- `index.html`: trang chủ dạng mục lục nội dung.
- `guides.html`: thư viện bài hướng dẫn.
- `guide-card-basics.html`: bài nhập môn football card.
- `guide-checklist.html`: bài hướng dẫn đọc checklist.
- `guide-buying-safe.html`: bài hướng dẫn mua bán an toàn.
- `legit-scam.html`: công cụ check legit/scam và mẫu hỏi seller.
- `stories.html`: danh sách câu chuyện legit, scam, bóc phốt theo tình huống ẩn danh.
- `affiliate.html`: danh mục sản phẩm affiliate.
- `checklist.html`: công cụ tra checklist sản phẩm.

## Font tiếng Việt

Site dùng font `Be Vietnam Pro` từ Google Fonts, kèm fallback `Arial, Tahoma, sans-serif`. Tất cả trang đều khai báo `lang="vi"` và `charset="utf-8"` để hiển thị tiếng Việt ổn định.

## Cập nhật nội dung

- Thêm bài hướng dẫn: tạo file HTML mới theo mẫu các file `guide-*.html`, rồi thêm link trong `guides.html` và `index.html` nếu cần.
- Thêm câu chuyện legit/scam/bóc phốt: thêm một `<article class="story-card" data-category="...">` trong `stories.html`. Các category hiện có là `legit`, `scam`, `expose`.
- Thay link affiliate: sửa thuộc tính `href` trong `affiliate.html`, giữ `rel="sponsored nofollow noopener"`.
- Thay dữ liệu checklist: cập nhật `data/list.json` và các file trong `data/seasons/`.

## Dữ liệu checklist

Mỗi item checklist hỗ trợ cấu trúc:

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

## Chạy local

Vì trang checklist đọc JSON bằng `fetch()`, hãy chạy qua static server:

```bash
python -m http.server 5501
```

Sau đó mở `http://127.0.0.1:5501`.

Trên Windows có thể dùng `run-local.bat` nếu đã cấu hình Python trong PATH.

## Đưa lên GitHub Pages

Đẩy toàn bộ thư mục lên repository và bật GitHub Pages cho branch chứa website. Site không cần framework, database hoặc bước build. File `CNAME` hiện có vẫn được giữ nguyên.
