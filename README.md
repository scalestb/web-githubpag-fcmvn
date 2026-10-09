# FCMVN

Website tĩnh Pixel Art cho cộng đồng sưu tầm football card Việt Nam. Trang chủ dẫn đến ba mục:

- `legit-scam.html`: danh sách LEGIT/SCAM có loại, tên Facebook, điểm số scam và phần chi tiết mở bằng click.
- `affiliate.html`: sáu nhóm sản phẩm với ảnh minh họa Pixel Art, tiêu đề và link cửa hàng.
- `checklist.html`: checklist Topps Flagship Premier League 2026/27, lọc theo danh sách thẻ, CLB và từ khóa.

## Dữ liệu cần bổ sung

Sáu tình huống legit/scam hiện là ví dụ ẩn danh từ website cũ. Chưa có tên Facebook, điểm số, ảnh bằng chứng hay link bài viết gốc, nên các trường đó hiển thị “Chưa cập nhật” hoặc “—/100”. Không dùng tình huống mẫu để kết luận về cá nhân cụ thể.

Mỗi hồ sơ trong `legit-scam.html` là một khối `<details class="case-card" ...>`. Khi có dữ liệu thật, cập nhật tên Facebook, điểm số, các dòng trong `case-lines`, ảnh trong `case-media` và thay dòng “LINK BÀI VIẾT GỐC” bằng liên kết bài viết tương ứng. Điểm số cần có tiêu chí chấm rõ ràng trước khi công bố.

Ảnh trong `assets/products/` là hình minh họa Pixel Art, không phải ảnh sản phẩm thật. Các nút mua hiện cùng dẫn đến cửa hàng FCMVN trên Shopee. Có thể thay đường dẫn và ảnh riêng của từng sản phẩm trong `affiliate.html`; giữ `rel="sponsored nofollow noopener noreferrer"`.

Checklist chỉ dùng `data/seasons/topps_flagship_premier_league_2026_27_checklist.json`. Các nút danh sách trong `checklist.html` khớp với trường `card_type` của dữ liệu.

## Chạy local

Checklist đọc JSON bằng `fetch()`, nên cần chạy qua static server:

```bash
python -m http.server 5501
```

Mở `http://127.0.0.1:5501`. Trên Windows có thể dùng `run-local.bat` nếu Python có trong PATH.

## GitHub Pages

Đẩy thư mục này lên repository và bật GitHub Pages cho branch chứa website. Không cần framework, database hay bước build. Giữ `CNAME` để dùng tên miền hiện tại.
