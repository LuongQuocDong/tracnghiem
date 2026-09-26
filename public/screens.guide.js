'use strict';

function guideSection(iconName, title, steps) {
  const box = panel([], { classes: 'mt14' });
  box.appendChild(el('div', { class: 'row gap10', style: { marginBottom: '10px', fontSize: '15px', fontWeight: 800 } }, [
    el('div', { class: 'icon-box', html: icon(iconName, 18), style: { width: '36px', height: '36px', background: 'var(--surface-3)' } }),
    el('span', { text: title }),
  ]));
  const list = el('ol', { class: 'guide-list' });
  steps.forEach((step) => list.appendChild(el('li', { html: step })));
  box.appendChild(list);
  return box;
}

async function renderGuide(root) {
  root.appendChild(pageTitle({ title: 'Hướng dẫn', hl: 'sử dụng', subtitle: 'Ôn luyện trên điện thoại hoặc máy tính. Cần có Internet để tải đề và lưu kết quả.' }));

  root.appendChild(guideSection('home', 'Bắt đầu', [
    'Chọn <b>Học viên</b> để làm bài. Nếu trường đã có danh sách học viên, chọn Tiểu đoàn → Đại đội → Lớp và tên của mình. Nếu chưa có danh sách, nhập tên khi bắt đầu bài.',
    'Chọn <b>Giảng viên</b> và nhập mật khẩu quản trị để quản lý đề, danh sách học viên và điểm. Mật khẩu do người triển khai web thiết lập trên Vercel.',
    'Trên điện thoại, thanh điều hướng nằm ở dưới màn hình; vuốt ngang để xem thêm các mục dành cho giảng viên.',
  ]));

  root.appendChild(guideSection('check', 'Trắc nghiệm A/B/C/D', [
    'Chọn môn, số câu và chế độ. <b>Cá nhân</b> hiển thị 10 câu mỗi trang, chấm sau khi nộp. <b>Giảng đường</b> hiện một câu một màn hình và báo đúng/sai ngay.',
    'Đề và thứ tự đáp án có thể được xáo ở mỗi lượt làm. Sau khi nộp, xem lại câu đúng và câu sai trên trang kết quả.',
    'Lịch sử trên trình duyệt của bạn hiển thị các lượt làm đã lưu. Giảng viên xem được lịch sử chung sau khi đăng nhập.',
  ]));

  root.appendChild(guideSection('pencil', 'Điền vào chỗ trống', [
    'Chọn bộ đề và số câu. Bạn có thể gõ đáp án hoặc chạm chọn từ trong danh sách. Kết quả hiện sau khi nộp bài.',
    'Các câu hỏi có thể dùng chỗ trống cố định hoặc tự chọn từ để ẩn; vì vậy cùng một câu có thể xuất hiện theo cách khác ở lượt sau.',
  ]));

  root.appendChild(guideSection('book', 'Dành cho giảng viên', [
    'Trong <b>Ngân hàng đề</b>, nhập file .txt hoặc dán nội dung. Mỗi câu trắc nghiệm gồm câu hỏi, 4 dòng A) B) C) D) và dòng <code>ANSWER: A</code> (thay A bằng đáp án đúng). Có thể thêm, sửa, xoá và xuất đề.',
    'Trong <b>Học viên</b>, thêm từng người hoặc nhập danh sách từ file .txt theo mẫu <code>Tiểu đoàn | Đại đội | Lớp | Họ tên</code>. Danh sách được dùng để chọn tên trước khi làm bài.',
    'Trong <b>Quản lý điểm</b>, chọn lớp và môn để xem các lượt làm của học viên. <b>Đồng bộ</b> cho phép xuất hoặc nhập một file sao lưu toàn bộ dữ liệu.',
    'Dữ liệu được lưu trong MongoDB Atlas của bản web. Chỉ người có mật khẩu quản trị mới sửa đề, danh sách và xem điểm chung.',
  ]));
  root.appendChild(el('div', { style: { height: '24px' } }));
}
