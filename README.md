# FCMVN — Football Card Field Guide

Website nội dung dành cho cộng đồng sưu tầm football trading card Việt Nam, xây dựng bằng HTML, CSS và JavaScript thuần để chạy trực tiếp trên GitHub Pages.

## Nội dung và tính năng

- Cẩm nang cơ bản: Base, Insert, Parallel, Serial, Rookie Card và Grading.
- Khu affiliate dụng cụ bảo quản với thông báo minh bạch.
- Bộ tự kiểm tra các dấu hiệu giao dịch có rủi ro legit/scam.
- Công cụ tra cứu theo cầu thủ, số thẻ, CLB, card type, serial và autograph.
- Giao diện hoài cổ kiểu matchday programme, responsive cho điện thoại và máy tính.
- Không cần framework, database hoặc bước build.

## Cập nhật affiliate link

Các liên kết hiện đang trỏ tới cửa hàng FCMVN trên Shopee. Khi có link affiliate riêng cho từng sản phẩm, thay thuộc tính `href` của các nút “Xem tại cửa hàng” trong `index.html`. Giữ nguyên `rel="sponsored nofollow noopener"` để đảm bảo minh bạch và an toàn.

## Dữ liệu checklist

- `data/list.json`: danh sách các dòng sản phẩm.
- `data/seasons/*.json`: dữ liệu thẻ của từng checklist.

Mỗi item hỗ trợ cấu trúc:

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

Vì checklist được đọc bằng `fetch()`, website cần chạy qua static server:

```bash
python3 -m http.server 5501
```

Sau đó mở `http://127.0.0.1:5501`.

Trên Windows có thể mở trực tiếp `run-local.bat`.

## Đưa lên GitHub Pages

Đẩy toàn bộ thư mục lên repository, sau đó vào **Settings → Pages** và chọn nhánh chứa website. Website không cần build. File `CNAME` đang giữ cấu hình tên miền tùy chỉnh hiện có.
