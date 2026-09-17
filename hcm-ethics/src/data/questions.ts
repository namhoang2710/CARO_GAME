export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: "easy" | "medium";
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q01",
    question: "Trong thời đại cách mạng 4.0, khi robot và AI thay thế nhiều công việc, giai cấp công nhân có còn giữ vai trò tiên phong không?",
    options: [
      "Vẫn giữ vai trò tiên phong",
      "Đã mất hoàn toàn vai trò tiên phong",
      "Chuyển giao vai trò tiên phong cho giới chủ đầu tư",
      "Không còn vai trò gì trong sản xuất",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giai cấp công nhân vẫn giữ vai trò tiên phong vì sứ mệnh lịch sử quyết định bởi địa vị kinh tế - xã hội chứ không phụ thuộc vào số lượng lao động cơ bắp.",
    difficulty: "easy",
  },
  {
    id: "q02",
    question: "Trong nền sản xuất hiện đại, robot và trí tuệ nhân tạo (AI) giữ vai trò gì đối với giai cấp công nhân?",
    options: [
      "Là công cụ lao động hiện đại do công nhân sáng tạo và vận hành",
      "Là chủ thể mới thay thế con người làm chủ xã hội",
      "Là giai cấp mới trong quan hệ sản xuất tư bản",
      "Là lực lượng lãnh đạo phong trào cách mạng",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Robot và AI chỉ là công cụ sản xuất hiện đại, giai cấp công nhân vẫn là chủ thể sáng tạo, vận hành và làm chủ công cụ đó.",
    difficulty: "easy",
  },
  {
    id: "q03",
    question: "Dù trình độ công nghệ nâng cao trong thời đại 4.0, bản chất kinh tế - xã hội nào của người công nhân trong chủ nghĩa tư bản vẫn không đổi?",
    options: [
      "Vẫn là người làm thuê và bán sức lao động để kiếm sống",
      "Đã trở thành chủ sở hữu tư liệu sản xuất chủ yếu",
      "Không còn bị bóc lột giá trị thặng dư",
      "Được nắm toàn quyền phân phối lợi nhuận xã hội",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Trong quan hệ sản xuất tư bản chủ nghĩa, người công nhân vẫn không có tư liệu sản xuất chủ yếu, buộc phải bán sức lao động và bị bóc lột giá trị thặng dư.",
    difficulty: "easy",
  },
  {
    id: "q04",
    question: "Xu hướng biến đổi nổi bật nhất của giai cấp công nhân trong nền kinh tế tri thức và cách mạng 4.0 là gì?",
    options: [
      "Xu hướng trí tuệ hóa, công nhân tri thức ngày càng tăng",
      "Xu hướng nông dân hóa người lao động",
      "Xu hướng giảm mạnh trình độ học vấn",
      "Xu hướng xóa bỏ hoàn toàn máy móc trong sản xuất",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Gắn liền với cách mạng khoa học công nghệ hiện đại, giai cấp công nhân có xu hướng trí tuệ hóa nhanh chóng (công nhân tri thức, công nhân áo trắng).",
    difficulty: "easy",
  },
  {
    id: "q05",
    question: "Nghị quyết số 20-NQ/TW của Ban Chấp hành Trung ương Đảng (khóa X) đề cập đến nội dung cốt lõi nào?",
    options: [
      "Tiếp tục xây dựng giai cấp công nhân Việt Nam thời kỳ đẩy mạnh CNH, HĐH đất nước",
      "Phát triển kinh tế nông nghiệp nông thôn",
      "Cải cách thủ tục hành chính công",
      "Phổ cập giáo dục đại học cho toàn dân",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Nghị quyết 20-NQ/TW chuyên đề về tiếp tục xây dựng giai cấp công nhân Việt Nam thời kỳ đẩy mạnh công nghiệp hóa, hiện đại hóa đất nước.",
    difficulty: "medium",
  },
  {
    id: "q06",
    question: "Tổ chức nào là đại diện bảo vệ quyền và lợi ích hợp pháp, chính đáng của giai cấp công nhân và người lao động Việt Nam?",
    options: [
      "Công đoàn Việt Nam",
      "Hội Nông dân Việt Nam",
      "Đoàn Thanh niên Cộng sản Hồ Chí Minh",
      "Hội Cựu chiến binh Việt Nam",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Công đoàn là tổ chức đại diện, chăm lo và bảo vệ quyền, lợi ích hợp pháp, chính đáng của người lao động.",
    difficulty: "easy",
  },
  {
    id: "q07",
    question: "Theo C. Mác và Ph. Ăngghen, giai cấp công nhân là sản phẩm và là con đẻ của nền sản xuất nào?",
    options: [
      "Nền đại công nghiệp tư bản chủ nghĩa",
      "Nền nông nghiệp phong kiến",
      "Nền kinh tế tự cấp tự túc thời cổ đại",
      "Nền sản xuất thủ công nghiệp gia đình",
    ],
    correctAnswerIndex: 0,
    explanation:
      "C. Mác và Ph. Ăngghen khẳng định giai cấp công nhân là sản phẩm và là con đẻ của nền đại công nghiệp hiện đại.",
    difficulty: "easy",
  },
  {
    id: "q08",
    question: "Thuật ngữ nào sau đây được C. Mác và Ph. Ăngghen dùng đồng nghĩa với 'giai cấp công nhân'?",
    options: [
      "Giai cấp vô sản",
      "Giai cấp nông dân",
      "Tầng lớp tiểu tư sản",
      "Tầng lớp trí thức",
    ],
    correctAnswerIndex: 0,
    explanation:
      "C. Mác và Ph. Ăngghen sử dụng nhiều thuật ngữ đồng nghĩa như giai cấp vô sản, giai cấp vô sản hiện đại, công nhân đại công nghiệp.",
    difficulty: "easy",
  },
  {
    id: "q09",
    question: "Chủ nghĩa Mác - Lênin xác định giai cấp công nhân dựa trên hai phương diện cơ bản nào?",
    options: [
      "Phương diện kinh tế - xã hội và phương diện chính trị - xã hội",
      "Phương diện địa lý và phương diện tôn giáo",
      "Phương diện văn hóa và phương diện ngoại giao",
      "Phương diện quân sự và phương diện hành chính",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giai cấp công nhân được nghiên cứu và xác định từ hai phương diện cơ bản: kinh tế - xã hội và chính trị - xã hội.",
    difficulty: "medium",
  },
  {
    id: "q10",
    question: "Về phương diện kinh tế - xã hội, đặc trưng nổi bật trong phương thức lao động của giai cấp công nhân là gì?",
    options: [
      "Sản xuất bằng máy móc, lao động mang tính xã hội hóa cao",
      "Sản xuất thuần túy bằng công cụ thủ công thô sơ",
      "Lao động phân tán, độc lập và khép kín",
      "Chỉ làm việc trong lĩnh vực trồng trọt nông nghiệp",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Công nhân lao động bằng phương thức công nghiệp hiện đại, công cụ máy móc, tính chất xã hội hóa cao và tạo năng suất cao.",
    difficulty: "easy",
  },
  {
    id: "q11",
    question: "Về phương diện chính trị - xã hội trong chủ nghĩa tư bản, vì sao công nhân buộc phải bán sức lao động để kiếm sống?",
    options: [
      "Vì họ không có sở hữu tư liệu sản xuất chủ yếu",
      "Vì họ không muốn quản lý tư liệu sản xuất",
      "Vì pháp luật cấm công nhân sở hữu tài sản",
      "Vì công nhân chỉ muốn làm công hưởng lương",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Do mất tư liệu sản xuất của bản thân, công nhân buộc phải bán sức lao động cho nhà tư bản để duy trì cuộc sống.",
    difficulty: "easy",
  },
  {
    id: "q12",
    question: "Trong chế độ tư bản chủ nghĩa, giai cấp đối kháng trực tiếp về mặt lợi ích cơ bản với giai cấp công nhân là giai cấp nào?",
    options: [
      "Giai cấp tư sản",
      "Giai cấp nông dân",
      "Tầng lớp trí thức",
      "Tầng lớp thợ thủ công",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giai cấp công nhân đối kháng trực tiếp với giai cấp tư sản do bị giai cấp tư sản bóc lột giá trị thặng dư.",
    difficulty: "easy",
  },
  {
    id: "q13",
    question: "Mâu thuẫn cơ bản trong phương thức sản xuất tư bản chủ nghĩa về mặt xã hội thể hiện thành mâu thuẫn giữa hai giai cấp nào?",
    options: [
      "Giai cấp công nhân và giai cấp tư sản",
      "Giai cấp nông dân và địa chủ phong kiến",
      "Giai cấp nô lệ và chủ nô",
      "Giai cấp tư sản và tầng lớp quý tộc",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Mâu thuẫn giữa lực lượng sản xuất xã hội hóa với quan hệ sản xuất tư nhân TBCN thể hiện về mặt xã hội thành mâu thuẫn giữa công nhân và tư sản.",
    difficulty: "medium",
  },
  {
    id: "q14",
    question: "Nền sản xuất đại công nghiệp rèn luyện cho giai cấp công nhân những phẩm chất đặc biệt nào?",
    options: [
      "Tính tổ chức, kỷ luật cao và tinh thần cách mạng triệt để",
      "Tư tưởng tự do cá nhân chủ nghĩa, tùy tiện",
      "Tâm lý tiểu nông phân tán, khép kín",
      "Thói quen ỷ lại, trông chờ vào sự hỗ trợ",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Nền sản xuất công nghiệp rèn luyện cho công nhân tính tổ chức, kỷ luật lao động, tinh thần hợp tác và phẩm chất cách mạng triệt để.",
    difficulty: "easy",
  },
  {
    id: "q15",
    question: "Sứ mệnh lịch sử tổng quát của giai cấp công nhân theo chủ nghĩa Mác - Lênin là gì?",
    options: [
      "Xóa bỏ chế độ bóc lột, xóa bỏ CNTB, xây dựng CNXH và CNCS văn minh",
      "Bảo vệ nguyên vẹn chế độ tư hữu tư bản chủ nghĩa",
      "Duy trì vĩnh viễn sự phân chia giai cấp trong xã hội",
      "Chỉ dừng lại ở đấu tranh đòi tăng lương, giảm giờ làm",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Sứ mệnh tổng quát là xóa bỏ các chế độ áp bức bóc lột, xóa bỏ chủ nghĩa tư bản, giải phóng con người và xây dựng xã hội cộng sản chủ nghĩa.",
    difficulty: "easy",
  },
  {
    id: "q16",
    question: "Về nội dung kinh tế, giai cấp công nhân đại biểu cho quan hệ sản xuất mới dựa trên chế độ sở hữu nào?",
    options: [
      "Chế độ công hữu về các tư liệu sản xuất chủ yếu",
      "Chế độ tư hữu lớn của các tập đoàn tư bản",
      "Chế độ tư hữu nhỏ của người sản xuất cá thể",
      "Chế độ chiếm hữu ruộng đất phong kiến",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Lực lượng sản xuất xã hội hóa đòi hỏi quan hệ sản xuất mới dựa trên chế độ công hữu các tư liệu sản xuất chủ yếu của xã hội.",
    difficulty: "medium",
  },
  {
    id: "q17",
    question: "Về nội dung chính trị - xã hội, mục tiêu của giai cấp công nhân sau khi giành được chính quyền là gì?",
    options: [
      "Thiết lập nhà nước kiểu mới mang bản chất công nhân, xây dựng nền dân chủ XHCN",
      "Khôi phục lại chính quyền quân chủ chuyên chế",
      "Tước đoạt tài sản sinh hoạt cá nhân của người dân",
      "Xóa bỏ mọi tổ chức chính trị và đoàn thể xã hội",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giai cấp công nhân thiết lập nhà nước kiểu mới mang bản chất giai cấp công nhân, xây dựng nền dân chủ XHCN do nhân dân làm chủ.",
    difficulty: "easy",
  },
  {
    id: "q18",
    question: "Về nội dung văn hóa, tư tưởng, hệ giá trị mới mà giai cấp công nhân tập trung xây dựng bao gồm những giá trị nào?",
    options: [
      "Lao động, công bằng, dân chủ, bình đẳng và tự do",
      "Đặc quyền đặc lợi, gia trưởng, hưởng thụ cá nhân",
      "Cục bộ, vị kỷ, sùng bái đồng tiền",
      "Thụ động, cam chịu số phận và mê tín dị đoan",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giáo trình khẳng định giai cấp công nhân tập trung xây dựng hệ giá trị mới: lao động; công bằng; dân chủ; bình đẳng và tự do.",
    difficulty: "medium",
  },
  {
    id: "q19",
    question: "Nền tảng tư tưởng và lý luận tiên tiến của phong trào công nhân là học thuyết nào?",
    options: [
      "Chủ nghĩa Mác - Lênin",
      "Chủ nghĩa tự do mới",
      "Chủ nghĩa xã hội không tưởng",
      "Học thuyết kinh tế cổ điển tư sản",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Chủ nghĩa Mác - Lênin là vũ khí lý luận khoa học và cách mạng, dẫn dắt giai cấp công nhân thực hiện thắng lợi sứ mệnh lịch sử.",
    difficulty: "easy",
  },
  {
    id: "q20",
    question: "Khẳng định nào sau đây là ĐÚNG về nguyên nhân quy định sứ mệnh lịch sử của giai cấp công nhân?",
    options: [
      "Do địa vị kinh tế và địa vị chính trị - xã hội khách quan của công nhân quy định",
      "Hoàn toàn vì công nhân là tầng lớp nghèo khổ nhất xã hội",
      "Do ý muốn chủ quan của các nhà lý luận sáng lập",
      "Do số lượng công nhân luôn chiếm đa số tuyệt đối ở mọi quốc gia",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giáo trình nhấn mạnh: Sứ mệnh lịch sử của GCCN hoàn toàn không phải vì nghèo khổ mà do địa vị kinh tế và địa vị chính trị - xã hội khách quan quy định.",
    difficulty: "medium",
  },
  {
    id: "q21",
    question: "Nhân tố chủ quan quan trọng NHẤT để giai cấp công nhân thực hiện thắng lợi sứ mệnh lịch sử của mình là gì?",
    options: [
      "Sự lãnh đạo của Đảng Cộng sản",
      "Sự hỗ trợ tài chính từ giai cấp tư sản",
      "Số lượng công nhân tăng lên một cách tự phát",
      "Sự nhượng bộ từ chính quyền tư sản",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Đảng Cộng sản - đội tiền phong của giai cấp công nhân - là nhân tố chủ quan quan trọng nhất để giai cấp công nhân hoàn thành sứ mệnh lịch sử.",
    difficulty: "easy",
  },
  {
    id: "q22",
    question: "Mối quan hệ giữa Đảng Cộng sản và giai cấp công nhân được xác định như thế nào?",
    options: [
      "Đảng Cộng sản là đội tiền phong, bộ tham mưu chiến đấu của giai cấp công nhân",
      "Đảng Cộng sản đứng ngoài và độc lập với giai cấp công nhân",
      "Đảng Cộng sản là tổ chức hiệp hội nghề nghiệp đơn thuần",
      "Đảng Cộng sản chỉ đại diện cho một nhóm nhỏ công nhân ưu tú",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Đảng Cộng sản là đội tiền phong của giai cấp công nhân, đại biểu trung thành cho lợi ích của giai cấp công nhân, của nhân dân và dân tộc.",
    difficulty: "medium",
  },
  {
    id: "q23",
    question: "Để thực hiện sứ mệnh lịch sử, giai cấp công nhân cần liên minh chặt chẽ với những giai cấp, tầng lớp nào?",
    options: [
      "Giai cấp nông dân và các tầng lớp lao động khác (đội ngũ trí thức)",
      "Giai cấp tư sản tài chính và địa chủ",
      "Tầng lớp quý tộc phong kiến thống trị",
      "Chỉ liên minh với người lao động tại các nước tư bản phát triển",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Khối liên minh giai cấp giữa công nhân với nông dân và các tầng lớp lao động khác do Đảng Cộng sản lãnh đạo là điều kiện tất yếu.",
    difficulty: "easy",
  },
  {
    id: "q24",
    question: "Trong điều kiện hiện nay, giai cấp công nhân có điểm tương đồng cơ bản nào so với thế kỷ XIX?",
    options: [
      "Vẫn là lực lượng sản xuất hàng đầu của xã hội hiện đại",
      "Vẫn chỉ lao động cơ bắp nặng nhọc, năng suất thấp",
      "Không còn ai trực tiếp làm việc trong công nghiệp",
      "Đã xóa bỏ hoàn toàn mâu thuẫn với giai cấp tư sản",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giai cấp công nhân hiện nay vẫn đang là lực lượng sản xuất hàng đầu của xã hội hiện đại, là chủ thể của nền sản xuất mang tính xã hội hóa cao.",
    difficulty: "easy",
  },
  {
    id: "q25",
    question: "Khái niệm 'công nhân tri thức' hay 'công nhân áo trắng' phản ánh xu hướng biến đổi nào của công nhân hiện nay?",
    options: [
      "Xu hướng trí tuệ hóa của giai cấp công nhân",
      "Xu hướng suy giảm vai trò của công nghệ",
      "Xu hướng công nhân quay lại làm nông nghiệp thủ công",
      "Xu hướng công nhân biến thành giai cấp tư sản",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Gắn liền với kinh tế tri thức, hao phí lao động hiện đại chủ yếu là trí lực, thúc đẩy xu hướng trí tuệ hóa giai cấp công nhân.",
    difficulty: "medium",
  },
  {
    id: "q26",
    question: "Hiện tượng 'trung lưu hóa' ở một bộ phận công nhân các nước tư bản hiện nay phản ánh điều gì?",
    options: [
      "Mức sống tăng và có sở hữu cổ phần, nhưng bản chất vẫn là người làm thuê chịu sự chi phối của tư sản",
      "Công nhân đã hoàn toàn nắm quyền sở hữu toàn bộ nền sản xuất",
      "Công nhân nắm toàn quyền định đoạt phân phối lợi nhuận xã hội",
      "Chủ nghĩa tư bản đã không còn bóc lột giá trị thặng dư",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Dù được 'trung lưu hóa' về mức sống thông qua cổ phần, quyền định đoạt sản xuất và cơ chế phân phối lợi nhuận vẫn thuộc về giai cấp tư sản.",
    difficulty: "medium",
  },
  {
    id: "q27",
    question: "Giai cấp công nhân Việt Nam ra đời trong hoàn cảnh lịch sử nào?",
    options: [
      "Gắn liền với các cuộc khai thác thuộc địa của thực dân Pháp vào đầu thế kỷ XX",
      "Sau khi đất nước hoàn thành công cuộc Đổi mới năm 1986",
      "Xuất hiện đồng thời với thời kỳ phong kiến độc lập",
      "Ra đời sau khi giai cấp tư sản dân tộc Việt Nam phát triển mạnh mẽ",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giai cấp công nhân Việt Nam ra đời từ cuộc khai thác thuộc địa của thực dân Pháp đầu thế kỷ XX, ra đời trước cả giai cấp tư sản dân tộc.",
    difficulty: "easy",
  },
  {
    id: "q28",
    question: "Điểm đặc thù về lịch sử ra đời của giai cấp công nhân Việt Nam so với công nhân các nước tư bản Tây Âu là gì?",
    options: [
      "Ra đời trước giai cấp tư sản dân tộc và trực tiếp đối kháng với thực dân Pháp",
      "Ra đời sau giai cấp tư sản trong điều kiện đại công nghiệp phát triển tột bậc",
      "Không có mối liên hệ nào với truyền thống yêu nước của dân tộc",
      "Hình thành từ tầng lớp quý tộc phong kiến sa sút",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Ở Việt Nam, công nhân ra đời trước giai cấp tư sản dân tộc, sớm có ý thức dân tộc và đối kháng trực tiếp với tư bản thực dân Pháp.",
    difficulty: "medium",
  },
  {
    id: "q29",
    question: "Giai cấp công nhân Việt Nam sinh ra và phát triển trong một xã hội có tính chất gì trước năm 1945?",
    options: [
      "Xã hội thuộc địa, nửa phong kiến",
      "Xã hội tư bản chủ nghĩa phát triển cao",
      "Xã hội chiếm hữu nô lệ",
      "Xã hội chủ nghĩa văn minh",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giai cấp công nhân Việt Nam sinh ra trong xã hội thuộc địa, nửa phong kiến, chịu ách áp bức bóc lột của cả đế quốc và phong kiến.",
    difficulty: "easy",
  },
  {
    id: "q30",
    question: "Theo Hội nghị Trung ương 6 khóa X, giai cấp công nhân Việt Nam bao gồm những bộ phận nào?",
    options: [
      "Những người lao động chân tay và trí óc, làm công hưởng lương trong sản xuất kinh doanh và dịch vụ công nghiệp",
      "Chỉ những người lao động chân tay đơn thuần trong các mỏ than",
      "Tất cả những người buôn bán tự do ngoài xã hội",
      "Chỉ những cán bộ quản lý cấp cao trong doanh nghiệp",
    ],
    correctAnswerIndex: 0,
    explanation:
      "GCCN Việt Nam bao gồm những người lao động chân tay và trí óc, làm công hưởng lương trong các loại hình sản xuất kinh doanh và dịch vụ công nghiệp.",
    difficulty: "easy",
  },
  {
    id: "q31",
    question: "Trong cơ cấu kinh tế nhiều thành phần ở Việt Nam hiện nay, đội ngũ công nhân ở khu vực nào giữ vai trò nòng cốt, chủ đạo?",
    options: [
      "Khu vực kinh tế nhà nước",
      "Khu vực kinh tế cá thể tiểu chủ",
      "Khu vực kinh tế tự nhiên khép kín",
      "Khu vực lao động tự do phi chính thức",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Đội ngũ công nhân ở khu vực kinh tế nhà nước giữ vai trò nòng cốt, chủ đạo trong việc định hướng và dẫn dắt phát triển kinh tế.",
    difficulty: "medium",
  },
  {
    id: "q32",
    question: "Về nội dung kinh tế, giai cấp công nhân Việt Nam hiện nay đóng vai trò gì trong sự nghiệp đổi mới?",
    options: [
      "Là lực lượng đi đầu trong sự nghiệp đẩy mạnh công nghiệp hóa, hiện đại hóa đất nước",
      "Là lực lượng đứng ngoài quá trình chuyển đổi số quốc gia",
      "Chỉ tham gia hỗ trợ hành chính văn phòng đơn thuần",
      "Chỉ tập trung vào công tác bảo tồn nghề thủ công cổ truyền",
    ],
    correctAnswerIndex: 0,
    explanation:
      "GCCN Việt Nam là nguồn nhân lực chủ yếu đi đầu trong công nghiệp hóa, hiện đại hóa gắn với phát triển kinh tế tri thức.",
    difficulty: "easy",
  },
  {
    id: "q33",
    question: "Mục tiêu tổng quát của sự nghiệp CNH, HĐH đất nước mà giai cấp công nhân Việt Nam phấn đấu thực hiện là gì?",
    options: [
      "Dân giàu, nước mạnh, dân chủ, công bằng, văn minh",
      "Tập trung tối đa hóa lợi nhuận cho giới chủ tư bản",
      "Đưa tất cả người dân vào làm việc trong các khu chế xuất",
      "Xóa bỏ hoàn toàn quan hệ trao đổi buôn bán quốc tế",
    ],
    correctAnswerIndex: 0,
    explanation:
      "GCCN Việt Nam là lực lượng đi đầu trong sự nghiệp CNH, HĐH vì mục tiêu: Dân giàu, nước mạnh, dân chủ, công bằng, văn minh.",
    difficulty: "easy",
  },
  {
    id: "q34",
    question: "Về nội dung chính trị - xã hội, nhiệm vụ then chốt hàng đầu của giai cấp công nhân Việt Nam là gì?",
    options: [
      "Giữ vững và tăng cường sự lãnh đạo của Đảng, bảo vệ chế độ xã hội chủ nghĩa",
      "Chuyển giao quyền lực cho các tổ chức kinh tế tư nhân",
      "Xóa bỏ vai trò lãnh đạo của Đảng Cộng sản",
      "Đóng cửa đất nước, không tham gia hội nhập quốc tế",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Công nhân Việt Nam nêu cao trách nhiệm giữ vững bản chất giai cấp của Đảng, bảo vệ Đảng, bảo vệ chế độ xã hội chủ nghĩa.",
    difficulty: "medium",
  },
  {
    id: "q35",
    question: "Về nội dung văn hóa - tư tưởng, nền tảng tư tưởng mà giai cấp công nhân Việt Nam kiên định là gì?",
    options: [
      "Chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh",
      "Chủ nghĩa thực dụng và chủ nghĩa cá nhân ích kỷ",
      "Tư tưởng bảo thủ, giáo điều thời trung cổ",
      "Các học thuyết tư sản đề cao sùng bái đồng tiền",
    ],
    correctAnswerIndex: 0,
    explanation:
      "GCCN Việt Nam kiên định nền tảng tư tưởng là chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh, kiên quyết đấu tranh phản bác các quan điểm sai trái.",
    difficulty: "easy",
  },
  {
    id: "q36",
    question: "Đại hội XIII của Đảng nhấn mạnh yêu cầu xây dựng giai cấp công nhân hiện đại thích ứng với điều kiện nào?",
    options: [
      "Thích ứng với cuộc Cách mạng công nghiệp lần thứ tư (CMCN 4.0)",
      "Thích ứng với phương thức sản xuất thủ công thô sơ",
      "Thích ứng với nền kinh tế thuần nông tự cung tự cấp",
      "Không cần đổi mới kỹ năng và tác phong công nghiệp",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Đại hội XIII nêu rõ: Xây dựng giai cấp công nhân hiện đại, lớn mạnh... thích ứng với cuộc Cách mạng công nghiệp lần thứ tư.",
    difficulty: "medium",
  },
  {
    id: "q37",
    question: "Khối liên minh nền tảng dưới sự lãnh đạo của Đảng Cộng sản Việt Nam gồm những giai cấp, tầng lớp nào?",
    options: [
      "Giai cấp công nhân với giai cấp nông dân và đội ngũ trí thức",
      "Giai cấp tư sản với tầng lớp địa chủ phong kiến",
      "Giới đầu tư tài chính với tầng lớp tiểu thương",
      "Giai cấp công nhân với các nhà tư bản nước ngoài",
    ],
    correctAnswerIndex: 0,
    explanation:
      "GCCN là lực lượng nòng cốt trong khối liên minh giai cấp công nhân với giai cấp nông dân và đội ngũ trí thức dưới sự lãnh đạo của Đảng.",
    difficulty: "easy",
  },
  {
    id: "q38",
    question: "Trong các doanh nghiệp FDI và khu công nghiệp tại Việt Nam hiện nay, người công nhân cần rèn luyện phẩm chất nào để thích ứng 4.0?",
    options: [
      "Trình độ chuyên môn, kỹ năng công nghệ và tác phong kỷ luật công nghiệp",
      "Thói quen làm việc tùy tiện, tự do theo lề lối tiểu nông",
      "Tâm lý an phận thủ thường, ngại học hỏi kỹ thuật mới",
      "Chỉ dựa vào sức lao động cơ bắp truyền thống",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Công nhân thời đại 4.0 cần nâng cao trình độ văn hóa, chuyên môn, kỹ năng nghề nghiệp, kỷ luật lao động và tác phong công nghiệp.",
    difficulty: "easy",
  },
  {
    id: "q39",
    question: "Một trong những giải pháp then chốt để xây dựng giai cấp công nhân Việt Nam lớn mạnh hiện nay là gì?",
    options: [
      "Đào tạo, bồi dưỡng, nâng cao trình độ mọi mặt và trí tuệ hóa giai cấp công nhân",
      "Hạn chế việc đào tạo nâng cao tay nghề cho công nhân trẻ",
      "Cắt giảm đầu tư cho khoa học kỹ thuật và chuyển đổi số",
      "Tách rời người công nhân khỏi sự chăm lo của tổ chức Công đoàn",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giải pháp cơ bản là đào tạo, bồi dưỡng, nâng cao trình độ mọi mặt, không ngừng trí tuệ hóa giai cấp công nhân (đặc biệt là công nhân trẻ).",
    difficulty: "medium",
  },
  {
    id: "q40",
    question: "Trách nhiệm xây dựng giai cấp công nhân Việt Nam ngày càng lớn mạnh thuộc về ai?",
    options: [
      "Của cả hệ thống chính trị, toàn xã hội và sự nỗ lực vươn lên của mỗi người công nhân",
      "Chỉ thuộc về các chủ doanh nghiệp trong khu công nghiệp",
      "Chỉ do bản thân từng người công nhân tự xoay xở",
      "Chỉ riêng của các cơ quan quản lý nhà nước",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Xây dựng giai cấp công nhân lớn mạnh là trách nhiệm của cả hệ thống chính trị, của toàn xã hội và sự nỗ lực vươn lên của mỗi người công nhân.",
    difficulty: "easy",
  },
  {
    id: "q41",
    question: "Quan niệm cho rằng 'Khi có robot và AI thì giai cấp công nhân sẽ biến mất hoàn toàn' là đúng hay sai theo lý luận Mác - Lênin?",
    options: [
      "Sai, vì công nhân vẫn là chủ thể sáng tạo, vận hành sản xuất và là người làm thuê chịu chi phối của tư bản",
      "Đúng, vì máy móc sẽ tự sản xuất mọi của cải mà không cần con người quản lý",
      "Đúng, vì robot đã trở thành một giai cấp mới thay thế con người",
      "Sai, nhưng vai trò công nhân sẽ nhường hoàn toàn cho tầng lớp chủ sở hữu",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Quan niệm đó là sai lầm; công nhân biến đổi theo hướng trí tuệ hóa, vận hành AI/robot và vẫn giữ địa vị là lực lượng sản xuất cơ bản trong xã hội.",
    difficulty: "easy",
  },
  {
    id: "q42",
    question: "Vì sao giai cấp nông dân hay tầng lớp trí thức không thể thay thế giai cấp công nhân lãnh đạo cách mạng?",
    options: [
      "Vì chỉ công nhân đại diện cho PTSX tiên tiến gắn với đại công nghiệp và có tính tổ chức, kỷ luật cao nhất",
      "Vì giai cấp nông dân và tầng lớp trí thức không có lòng yêu nước",
      "Vì nông dân và trí thức chiếm số lượng quá ít trong cơ cấu xã hội",
      "Vì nông dân và trí thức không tham gia vào hoạt động lao động",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Chỉ có giai cấp công nhân đại biểu cho phương thức sản xuất tiên tiến, có tính tổ chức, kỷ luật cao và có hệ tư tưởng Mác - Lênin dẫn dắt.",
    difficulty: "medium",
  },
  {
    id: "q43",
    question: "Theo C. Mác và Ph. Ăngghen, sự sụp đổ của giai cấp tư sản và thắng lợi của giai cấp vô sản có tính chất gì?",
    options: [
      "Đều là tất yếu khách quan như nhau",
      "Là điều hoàn toàn ngẫu nhiên do may rủi lịch sử",
      "Là điều không thể xảy ra trong thực tế phát triển",
      "Chỉ xảy ra ở các nước nông nghiệp lạc hậu",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Tuyên ngôn của Đảng Cộng sản khẳng định: Sự sụp đổ của giai cấp tư sản và thắng lợi của giai cấp vô sản đều là tất yếu như nhau.",
    difficulty: "medium",
  },
  {
    id: "q44",
    question: "Nhận thức đúng đắn về vị thế người công nhân Việt Nam trong các tập đoàn công nghệ và nhà máy FDI là gì?",
    options: [
      "Vừa là người làm công hưởng lương, vừa là lực lượng nòng cốt làm chủ công nghệ đóng góp cho đất nước",
      "Chỉ là người lao động thụ động không có quyền lợi gì",
      "Đã trở thành giai cấp tư sản nhờ có thu nhập hàng tháng",
      "Không cần nâng cao trình độ vì đã có chuyên gia nước ngoài làm thay",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Công nhân trong doanh nghiệp FDI là nguồn nhân lực năng động, tiếp thu chuyển giao công nghệ cao, đóng góp quan trọng vào sự phát triển của đất nước.",
    difficulty: "easy",
  },
  {
    id: "q45",
    question: "Mục tiêu học tập Chương 2 môn Chủ nghĩa xã hội khoa học (MLN131) giúp sinh viên điều gì?",
    options: [
      "Nắm vững sứ mệnh lịch sử của giai cấp công nhân và củng cố niềm tin vào con đường đi lên CNXH",
      "Chỉ để học thuộc lòng ngày tháng lịch sử để trả lời thi cử",
      "Học cách lắp ráp máy móc cơ khí trong công xưởng",
      "Tránh né các vấn đề thời sự thực tiễn trong kỷ nguyên 4.0",
    ],
    correctAnswerIndex: 0,
    explanation:
      "Giúp sinh viên nắm vững lý luận Mác - Lênin về GCCN, củng cố niềm tin khoa học và lập trường giai cấp đối với sự nghiệp xây dựng CNXH.",
    difficulty: "easy",
  },
];

function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
  const shuffledOptions = question.options
    .map((option, index) => ({ index, option, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort);

  return {
    ...question,
    options: shuffledOptions.map(({ option }) => option),
    correctAnswerIndex: shuffledOptions.findIndex(({ index }) => index === question.correctAnswerIndex),
  };
}

export function getRandomQuestion(excludedIds: string[] = []): QuizQuestion | null {
  if (quizQuestions.length === 0) {
    return null;
  }

  const pool = quizQuestions.filter((question) => !excludedIds.includes(question.id));
  const available = pool.length > 0 ? pool : quizQuestions;
  return shuffleQuestionOptions(available[Math.floor(Math.random() * available.length)]);
}
