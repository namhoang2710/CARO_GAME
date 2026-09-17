# Bộ câu hỏi cho thuyết trình Nhóm 1

Chủ đề: Trong thời đại cách mạng 4.0, khi robot và AI thay thế nhiều công việc, giai cấp công nhân có còn giữ vai trò tiên phong không? Vì sao?

## Phạm vi

30 câu cơ bản, mỗi câu 4 lựa chọn và 1 đáp án đúng rõ ràng. Không dùng câu hỏi phủ định, gài bẫy, ghi nhớ ngày tháng hay các lựa chọn gần giống nhau. Giải thích ngắn xuất hiện sau khi trả lời.

- 01–10: AI/robot, thay đổi công việc, công nhân tri thức, học tập và tay nghề.
- 11–20: Cơ sở của vai trò tiên phong, sản xuất tiên tiến, tổ chức, kỷ luật, hợp tác và sứ mệnh lịch sử.
- 21–30: Việt Nam, Công đoàn, Nghị quyết 20-NQ/TW, khu công nghiệp/FDI, đào tạo và liên minh công nhân – nông dân – trí thức.

Game ưu tiên nhóm chủ đề đã xuất hiện ít nhất, hòa thì theo thứ tự AI/robot → vai trò → Việt Nam. Với lượt chơi mới, mỗi ba câu bao quát đủ ba phần. Câu được chọn ngẫu nhiên trong nhóm, không lặp trước khi dùng hết bộ; vị trí đáp án vẫn được đảo.

## Căn cứ biên soạn

- Bản trích Chương 2 MLN131 người dùng cung cấp: mục I.1–I.3, II.1 và III.1–III.3.
- Đề cương thuyết trình của thầy do người dùng cung cấp: nội dung AI/robot, Công đoàn, khu công nghiệp/FDI và Nghị quyết 20-NQ/TW.
- Các ví dụ vận hành robot, học kỹ năng và đào tạo dây chuyền là tình huống minh họa đơn giản, không phải số liệu về doanh nghiệp cụ thể.

Không thêm câu hỏi về Văn kiện Đại hội XIV vì chưa có tài liệu đó trong nội dung được cung cấp. Không đổi trích dẫn Đại hội XIII trong bản trích thành XIV.

Phân biệt làm chủ kỹ năng công nghệ với sở hữu nhà máy; giới hạn nội dung bán sức lao động trong quan hệ sản xuất tư bản chủ nghĩa. Sứ mệnh không chỉ dựa vào số lượng, nhưng việc phát triển cả số lượng và chất lượng vẫn quan trọng.

## Áp dụng

Dữ liệu nằm trong `src/data/questions.ts`. Chỉ cần triển khai lại ứng dụng, không cần migration SQL hay xóa dữ liệu Supabase. Nên triển khai giữa các phiên. Câu hỏi đang lưu trong phiên cũ được giữ nguyên đến khi trả lời xong; lần rút tiếp theo dùng bộ mới. Mã `cn4-v2-*` tách biệt lịch sử câu hỏi cũ.
