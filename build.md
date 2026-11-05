# Báo cáo dựng web FCMVN

## Đã thực hiện

- Dựng website tĩnh tiếng Việt, giao diện tối giản với tông kem và xanh nhạt, chi tiết thẻ cầu thủ phong cách pixel; có bố cục cho màn hình nhỏ.
- Bảng **Card hot** đọc từ `data/hot.json`; bảng **Đang bid** đọc từ `data/bids.json`.
- **Razz**: nhập phần thưởng và danh sách vé (mỗi dòng một vé), chọn tắt xúc xắc hoặc dùng 1–3 viên. Khi bật xúc xắc, tổng điểm là số vòng quay; khi tắt, người dùng chọn 1–18 vòng. Vòng cuối xác định người thắng. Việc chọn vé dùng `crypto.getRandomValues` của trình duyệt, không gửi danh sách người tham gia lên máy chủ.
- **Góc cộng đồng** đọc `data/community.json`, hỗ trợ thông tin cảnh báo gắn tài khoản và nguồn bài viết, cùng danh sách tài khoản legit. Dữ liệu hiện tại chỉ là nội dung hướng dẫn mẫu, không gắn cáo buộc hay xác nhận cho tài khoản thật.
- Liên kết nguồn chỉ hiện khi JSON có URL HTTP/HTTPS hợp lệ. Nội dung JSON được đưa lên trang bằng `textContent` để tránh chèn HTML ngoài ý muốn.

## Cách chạy và đăng GitHub Pages

1. Chạy thử tại thư mục repo: `python3 -m http.server 8765` rồi mở `http://localhost:8765/`. Không mở trực tiếp `index.html` bằng `file://` vì trình duyệt có thể chặn tải JSON.
2. Repo hiện đang ở nhánh `src_V4`; nhánh `main` vẫn chứa site cũ. Khi quyết định thay site đang chạy, đưa mã mới lên nhánh được chọn trong **Settings → Pages** với thư mục **/(root)**. Tệp `CNAME` đã giữ tên miền hiện tại `fcmvn.com`.
3. Để thêm bài thật, sửa các tệp trong `data/`, kiểm tra JSON hợp lệ rồi commit/push. `sourceUrl` là đường dẫn bài gốc; `accountUrl` là đường dẫn tài khoản liên quan. Dùng `null` khi chưa có link. Thông tin giá bid và thời hạn cần đối chiếu tại bài gốc vì JSON là bản chụp tại thời điểm cập nhật.

Bản mới chưa được đẩy lên remote hoặc thay site đang chạy. GitHub Pages phục vụ HTML/CSS/JavaScript tĩnh từ repo, nên trang không có tác vụ chạy nền hay nơi cất token bí mật. [Tài liệu GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Lấy bài từ nhóm Facebook

**Không thể chỉ kết nối token tài khoản Facebook vào trang này để tự động lấy bài từ các nhóm chỉ định.** Meta đã ngừng Facebook Groups API và các quyền liên quan từ 22/04/2024; token cá nhân không khôi phục được API đó. Xem [changelog Graph API v19.0 của Meta](https://developers.facebook.com/docs/graph-api/changelog/version19.0) và [thông báo Graph API v19.0](https://developers.facebook.com/blog/post/2024/01/23/introducing-facebook-graph-and-marketing-api-v19/).

Phương án phù hợp cho bản đầu: quản trị viên chọn bài được phép chia sẻ, xác minh thông tin, nhập tóm tắt và link bài gốc vào JSON. Nếu sau này dùng một nguồn dữ liệu được Meta cho phép hoặc dịch vụ có quyền hợp lệ, đặt tác vụ nhập liệu ở phía máy chủ/CI và lưu bí mật trong secret của dịch vụ đó, **không** đưa token vào `app.js`, JSON hoặc repo GitHub Pages. Việc thu thập bài từ nhóm riêng tư cần sự đồng ý và quyền truy cập phù hợp.

Với mục **Bốc phốt**, chỉ đăng nội dung đã có bằng chứng và trạng thái xác minh rõ; tạo cơ hội phản hồi trước khi gắn một tài khoản thật vào cảnh báo. Danh sách legit cũng cần tiêu chí kiểm chứng và ngày rà soát.

## Kiểm tra

- `node --check app.js`: đạt.
- Kiểm tra cú pháp cả ba tệp JSON bằng `python3 -m json.tool`: đạt.
- Máy chủ HTTP cục bộ trả `200 OK` cho trang chính. Công cụ trình duyệt trong phiên này không khả dụng nên chưa kiểm tra trực quan hoặc thao tác Razz bằng trình duyệt.
