# Bản sửa phiên chơi

- Quiz dùng dialog căn giữa viewport, có cuộn bên trong khi màn hình thấp.
- Bấm đáp án/thẻ sẽ đánh dấu lựa chọn ngay. Đúng/sai và điểm vẫn do server xác nhận, không gửi đáp án trước cho trình duyệt.
- Thẻ đã bốc có màn hình tên và tác dụng; chỉ áp dụng khi người chơi bấm **Đã hiểu**. Tải lại trang vẫn giữ thẻ. Đồng hồ phiên tiếp tục chạy; đóng băng 8 giây tính từ lúc xác nhận.
- Mỗi người tham gia chỉ có một ván mỗi phiên. Thắng/thua/hòa khóa ván tại server, không tự mở ván mới. Tải lại trang không cấp lượt mới. Người chơi vẫn xem bảng điểm và có thể chịu tác động thẻ từ người khác cho tới khi admin chốt phiên.
- Thao tác không tác động người khác dùng 2 lượt gọi Supabase thay vì 3. Thẻ cướp/chia vẫn đọc lại kết quả giao dịch từ database.
- Bot tái sử dụng đánh giá nước đi trong cùng một lần tính, không lưu cache bàn cờ qua phiên.
- Vercel được cấu hình vùng `hnd1` (Tokyo) cùng vùng Supabase của dự án. Nếu chuyển database sang vùng khác, cần đổi cấu hình tương ứng.

## Cập nhật bản đang deploy

Deploy lại mã nguồn mới trên đúng project Vercel đang dùng. Cấu hình vùng có trong cả `vercel.json` ở root repo và ở `hcm-ethics`, hỗ trợ hai cách chọn Root Directory.

**Không cần migration SQL mới** nếu bản phiên chơi trước đã chạy `supabase/01-session-game.sql`. Không xóa bảng hay dữ liệu người chơi. Nên cập nhật giữa hai phiên, rồi tải lại trang ở thiết bị admin/người chơi để tránh frontend cũ gọi API mới.

Giới hạn một lượt được gắn với người tham gia/token trong phòng; đây không phải xác minh danh tính thật. Một người cố ý đăng ký nhiều tên trước lúc admin bắt đầu vẫn cần admin kiểm soát danh sách, hoặc bổ sung đăng nhập/mã sinh viên được xác thực.

## Kiểm thử

Trong `hcm-ethics`: `npm test`, `npm run lint`, `npm run build`, `npx playwright test`.
Kiểm thử trình duyệt dùng PostgreSQL thử nghiệm cục bộ, không chạm Supabase production. Độ trễ thực tế sau deploy còn phụ thuộc mạng, cold start và tải database.
