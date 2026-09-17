# Cập nhật lịch sử điểm cá nhân

## Triển khai trên bản đang chạy

1. Chờ kết thúc phiên đang chơi.
2. Trong Supabase → SQL Editor, chạy toàn bộ `supabase/02-private-score-history.sql` **một lần**. Có thể chạy lại an toàn; không xóa phiên hay điểm cũ.
3. Deploy mã nguồn mới lên Vercel và tải lại trang trên các thiết bị.

Project mới: chạy `01-session-game.sql` rồi `02-private-score-history.sql`, theo đúng thứ tự. Không chạy riêng file 01 sau file 02 vì nó định nghĩa lại hàm snapshot phiên bản cũ; nếu lỡ làm vậy, chạy lại file 02.

Không thêm biến môi trường/dependency mới. Giữ `SUPABASE_SERVICE_ROLE_KEY` chỉ ở server như hiện tại. Lịch sử bắt đầu ghi từ khi dùng API mới; không thể dựng lại chính xác các giao dịch trước đó chỉ từ tổng điểm.

## Hành vi

- Người chơi có bảng điểm cá nhân, dòng biến động gần nhất và “Dòng điểm của bạn”.
- Quiz, thẻ, thưởng kết thúc ván được ghi kèm chênh lệch thực tế, thời gian và số dư. Nếu một thao tác vừa áp dụng thẻ vừa kết thúc ván, nhãn ghi cả hai và số điểm là thay đổi ròng của thao tác.
- Cướp/chia điểm có dòng riêng cho cả hai người, kèm tên đối phương. Điểm chạm trần vẫn ghi số nhận thực tế và lượng điểm lấy từ đối phương.
- Dữ liệu nằm ở Supabase, không lưu lịch sử vào localStorage. Trình duyệt chỉ giữ một trang 20 dòng; “Xem cũ hơn” và “Về mới nhất” dùng phân trang theo ID.
- Lịch sử riêng chỉ trả về qua token người tham gia cùng phòng. RLS không cho anon/authenticated đọc bảng, và không đưa dữ liệu này vào danh sách xếp hạng công khai.
- Điểm và lịch sử ghi trong cùng giao dịch database; thao tác lỗi được rollback, gửi trùng không tạo lịch sử trùng.
- Realtime vẫn dùng thông báo cập nhật phòng hiện có, không mở thêm subscription hoặc polling riêng cho lịch sử. Xem trang mới nhất tự nhận cập nhật; trang cũ giữ nguyên để đọc.
- Kết thúc phiên vẫn xem được lịch sử trên màn hình kết quả hiện tại. Token trình duyệt được dọn như trước; tải lại sau khi token đã bị xóa sẽ về quyền người xem, không còn xem lịch sử riêng. Dữ liệu lịch sử server vẫn giữ cùng phiên.

## Giao diện và hiệu năng

Giữ nhận diện xanh/lime, bổ sung thẻ điểm cá nhân, thứ hạng, tiến độ tới quiz, màu tăng/giảm điểm và họa tiết thẻ bài. Chuyển động ngắn cho số điểm, dòng mới, quân cờ và lật thẻ; không có animation lặp vô hạn, hiệu ứng blur hoặc thư viện animation bổ sung. Tôn trọng `prefers-reduced-motion`.

API chơi dùng hai lượt gọi Supabase cho cả thẻ thường lẫn thẻ tác động người khác. RPC mới trả thẳng snapshot sau khi commit, không thêm lượt fetch riêng để lấy lịch sử.

## Kiểm thử

`npm test`, `npm run build`, `npm run lint`, `npx playwright test` trong thư mục `hcm-ethics`.
Database và trình duyệt tự động chạy với dữ liệu thử nghiệm cục bộ; không ghi vào Supabase production.
