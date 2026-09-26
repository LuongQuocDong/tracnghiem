# Trắc Nghiệm Thử · Bản web mobile

Bản web từ ứng dụng TracNghiem Electron, dành cho học viên làm bài bằng điện thoại và giảng viên quản lý đề, danh sách, điểm. Giao diện tĩnh nằm trong `public/`; API Node.js trong `api/` lưu dữ liệu bằng MongoDB Atlas. Repo này không chứa mật khẩu, danh sách học viên hay lịch sử làm bài của bản desktop.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên.

1. `npm install`
2. Tạo `.env.local` từ `.env.example`. Điền `MONGODB_URI`, `ADMIN_PASSWORD` (mật khẩu dài, ngẫu nhiên) và `SESSION_SECRET` (chuỗi ngẫu nhiên khác mật khẩu).
3. `npm run seed` để nạp 7 môn trắc nghiệm và 1 bộ điền chỗ trống. Lệnh chỉ thêm đề chưa có, không ghi đè đề đã sửa.
4. `npm run dev`, mở `http://localhost:3000`.

Ứng dụng tra bản ghi MongoDB qua DNS HTTPS để tránh lỗi `querySrv ETIMEOUT` trên một số mạng; nếu dịch vụ DNS HTTPS không sẵn sàng, ứng dụng thử lại bằng DNS SRV thông thường. Có thể đặt `MONGODB_DNS_SERVERS=ip1,ip2` để hỗ trợ cách tra DNS thông thường trên máy riêng.

## Đưa lên Vercel

1. Import repo GitHub này vào Vercel. Framework Preset: **Other**; Root Directory: gốc repo; Output Directory: `public` (đã ghi trong `vercel.json`).
2. Thêm biến môi trường `MONGODB_URI`, `MONGODB_DB` (mặc định `tracnghiemapp`), `ADMIN_PASSWORD`, `SESSION_SECRET` cho Production và Preview. Dùng giá trị tương ứng trong `.env.local` trên máy này nếu muốn dùng cùng database và mật khẩu quản trị.
3. Vercel dùng IP đầu ra thay đổi. Trong MongoDB Atlas → **Database & Network Access** → **IP Access List**, bản Hobby cần mục `0.0.0.0/0` để Function kết nối được. Chỉ mở IP khi đã dùng mật khẩu MongoDB mạnh, giữ URI trong Environment Variables và bảo vệ tài khoản Atlas; gói Vercel có IP tĩnh có thể giới hạn danh sách IP chặt hơn. Sau đó Deploy lại nếu vừa sửa biến môi trường.

Vercel chạy `api/rpc.js` như một Node.js Function. [Hướng dẫn Functions](https://vercel.com/docs/functions/runtimes/node-js) và [thiết lập build](https://vercel.com/docs/builds/configure-a-build) giải thích cấu trúc `api/` và thư mục tĩnh `public/`.

## Sử dụng

- **Học viên:** Chọn Học viên, chọn lớp nếu đã có danh sách; nếu chưa có, dùng lớp Tự do và nhập tên trước khi làm bài. Lịch sử trên thiết bị này gắn với cookie riêng của trình duyệt.
- **Giảng viên:** Chọn Giảng viên, nhập `ADMIN_PASSWORD` để quản lý đề, danh sách học viên, điểm và sao lưu. Khi chưa có danh sách, thêm học viên trong mục Học viên.
- **Đề mẫu:** Đã nạp lên Atlas được cấu hình trên máy này. Với database mới, chạy `npm run seed` hoặc bấm **Nạp đề mẫu** khi đăng nhập quản trị.
- **Dữ liệu desktop:** Bản web không tự tải danh sách học viên hoặc lịch sử cũ. Giảng viên có thể vào **Đồng bộ** để nhập file sao lưu do bản desktop xuất ra.

`MONGODB_URI` chỉ được dùng phía máy chủ. `.env.local` bị Git bỏ qua; tuyệt đối không thêm file này vào commit. Kết quả trắc nghiệm A/B/C/D được máy chủ chấm lại từ câu hỏi đã lưu. Phần điền chỗ trống hiện dùng điểm tính tại trình duyệt như bản desktop, phù hợp luyện tập và chưa có cơ chế chống sửa điểm.

## Kiểm tra

- `npm test`: kiểm tra phân quyền và chấm điểm trắc nghiệm.
- `node scripts/smoke.js` khi server địa phương đang chạy và Atlas đã có đề mẫu: thử API, đăng nhập quản trị, lưu/xóa một kết quả thử.
