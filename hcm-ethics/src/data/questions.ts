export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: "easy" | "medium";
};

const questionTopics = ["technology", "role", "vietnam"] as const;
type QuestionTopic = (typeof questionTopics)[number];

// Based on the supplied Chapter 2 excerpt and the teacher's presentation outline.
// Short recall questions only: one clear answer, no trick wording.
// Versioned IDs keep old session history separate from this rewritten bank.
export const quizQuestions: (QuizQuestion & { topic: QuestionTopic })[] = [
  {
    id: "cn4-v2-01", topic: "technology",
    question: "Theo bài thuyết trình, công nhân còn giữ vai trò tiên phong trong thời đại AI không?",
    options: ["Vẫn giữ vai trò tiên phong", "Đã mất hoàn toàn vai trò", "Chỉ còn vai trò trong quá khứ", "Nhường vai trò cho robot"],
    correctAnswerIndex: 0,
    explanation: "Công nhân vẫn gắn với nền sản xuất hiện đại. AI làm thay đổi công việc, không tự xóa bỏ vai trò của giai cấp công nhân.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-02", topic: "technology",
    question: "Trong sản xuất, robot và AI là gì?",
    options: ["Công cụ hỗ trợ và tự động hóa lao động", "Một giai cấp xã hội mới", "Tổ chức bảo vệ người lao động", "Một chính đảng"],
    correctAnswerIndex: 0,
    explanation: "Robot và AI là công cụ công nghệ trong sản xuất, không phải một giai cấp xã hội.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-03", topic: "technology",
    question: "Khi nhà máy dùng robot, công nhân có thể đảm nhận công việc nào?",
    options: ["Vận hành, giám sát và bảo trì hệ thống", "Bỏ mặc máy móc tự hoạt động", "Ngừng học mọi kỹ năng mới", "Bỏ qua kiểm tra an toàn"],
    correctAnswerIndex: 0,
    explanation: "Công nhân có thể chuyển sang vận hành, giám sát và bảo trì hệ thống tự động khi được đào tạo phù hợp.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-04", topic: "technology",
    question: "Công nhân cần làm gì để thích ứng với công nghệ mới?",
    options: ["Học thêm kiến thức và kỹ năng nghề", "Chỉ dựa vào sức khỏe", "Tránh tiếp xúc với máy móc mới", "Ngừng học sau khi có việc làm"],
    correctAnswerIndex: 0,
    explanation: "Nâng cao kiến thức, tay nghề và kỹ năng công nghệ giúp công nhân thích ứng với sản xuất hiện đại.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-05", topic: "technology",
    question: "Xu hướng 'trí tuệ hóa' công nhân có nghĩa là gì?",
    options: ["Sử dụng nhiều hơn kiến thức và kỹ năng trong lao động", "Chỉ sử dụng sức cơ bắp", "Không cần học nghề", "Rời bỏ hoàn toàn sản xuất"],
    correctAnswerIndex: 0,
    explanation: "Trí tuệ hóa là xu hướng công nhân nâng cao tri thức, trình độ và kỹ năng để đáp ứng sản xuất hiện đại.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-06", topic: "technology",
    question: "Theo bài thuyết trình, bộ phận công nhân nào ngày càng phát triển?",
    options: ["Công nhân tri thức, công nhân công nghệ cao", "Công nhân chỉ làm việc bằng công cụ thô sơ", "Công nhân không cần kỹ năng nghề", "Công nhân tách rời công nghệ"],
    correctAnswerIndex: 0,
    explanation: "Sản xuất hiện đại thúc đẩy sự phát triển của công nhân tri thức và công nhân có trình độ công nghệ cao.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-07", topic: "technology",
    question: "Cách mạng 4.0 đặt ra yêu cầu gì về tay nghề của công nhân?",
    options: ["Ngày càng nâng cao tay nghề", "Không cần đào tạo nữa", "Chỉ cần làm theo thói quen cũ", "Giảm hiểu biết về công nghệ"],
    correctAnswerIndex: 0,
    explanation: "Công nghệ thay đổi đòi hỏi người công nhân thường xuyên nâng cao trình độ chuyên môn và tay nghề.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-08", topic: "technology",
    question: "Trong quan hệ sản xuất tư bản chủ nghĩa, công nhân làm thuê bán gì để kiếm sống?",
    options: ["Sức lao động", "Toàn bộ nhà máy của mình", "Quyền sở hữu đất nước", "Quyền ban hành pháp luật"],
    correctAnswerIndex: 0,
    explanation: "Theo Chương 2, công nhân trong quan hệ sản xuất tư bản chủ nghĩa phải bán sức lao động vì không sở hữu tư liệu sản xuất chủ yếu.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-09", topic: "technology",
    question: "Công nhân trong nền sản xuất hiện đại sử dụng những năng lực nào?",
    options: ["Cả thể lực, kiến thức và kỹ năng", "Chỉ sức cơ bắp", "Chỉ khả năng ghi nhớ tên máy", "Không cần năng lực chuyên môn"],
    correctAnswerIndex: 0,
    explanation: "Lao động công nghiệp không chỉ là lao động cơ bắp; kiến thức và kỹ năng ngày càng quan trọng.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-10", topic: "technology",
    question: "Nhà máy lắp dây chuyền tự động mới nên hỗ trợ công nhân thế nào?",
    options: ["Đào tạo kỹ năng vận hành công nghệ mới", "Để công nhân tự đoán cách vận hành", "Bỏ các hướng dẫn an toàn", "Dừng mọi hoạt động học nghề"],
    correctAnswerIndex: 0,
    explanation: "Đào tạo và bồi dưỡng kỹ năng giúp công nhân thích ứng khi công nghệ và công việc thay đổi.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-11", topic: "role",
    question: "Sứ mệnh lịch sử của giai cấp công nhân được quy định bởi điều gì?",
    options: ["Địa vị kinh tế - xã hội của họ", "Số lượng người nghèo trong xã hội", "Sở thích của từng cá nhân", "Số giờ lao động chân tay"],
    correctAnswerIndex: 0,
    explanation: "Theo Chương 2, cơ sở là địa vị kinh tế và chính trị - xã hội, không đơn thuần là đông người hay nghèo khổ.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-12", topic: "role",
    question: "Giai cấp công nhân đại diện cho phương thức sản xuất nào?",
    options: ["Phương thức sản xuất tiên tiến", "Sản xuất tự cung tự cấp", "Sản xuất chỉ bằng công cụ thô sơ", "Sản xuất phong kiến khép kín"],
    correctAnswerIndex: 0,
    explanation: "Giai cấp công nhân gắn với nền đại công nghiệp và đại diện cho lực lượng sản xuất, phương thức sản xuất tiên tiến.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-13", topic: "role",
    question: "Đặc điểm nổi bật của giai cấp công nhân là gì?",
    options: ["Có tính tổ chức và kỷ luật cao", "Làm việc tùy tiện", "Không cần hợp tác", "Tách rời hoạt động sản xuất"],
    correctAnswerIndex: 0,
    explanation: "Nền sản xuất công nghiệp rèn luyện tính tổ chức, kỷ luật và tinh thần hợp tác của công nhân.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-14", topic: "role",
    question: "Làm việc trên dây chuyền sản xuất cần tinh thần nào?",
    options: ["Hợp tác và phối hợp với nhau", "Mỗi người làm tùy ý", "Không trao đổi với đồng nghiệp", "Bỏ qua quy trình chung"],
    correctAnswerIndex: 0,
    explanation: "Sản xuất công nghiệp mang tính xã hội hóa cao, đòi hỏi sự phối hợp và tuân thủ quy trình.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-15", topic: "role",
    question: "Theo Chương 2, giai cấp công nhân có tinh thần cách mạng như thế nào?",
    options: ["Triệt để", "Cam chịu áp bức", "Bảo vệ chế độ bóc lột", "Thờ ơ với quyền lợi người lao động"],
    correctAnswerIndex: 0,
    explanation: "Tinh thần cách mạng triệt để là một đặc điểm của giai cấp công nhân được nêu trong Chương 2.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-16", topic: "role",
    question: "Theo Chương 2, tổ chức nào là đội tiền phong của giai cấp công nhân?",
    options: ["Đảng Cộng sản", "Câu lạc bộ thể thao", "Hiệp hội du lịch", "Hội người tiêu dùng"],
    correctAnswerIndex: 0,
    explanation: "Đảng Cộng sản là đội tiền phong, lãnh đạo giai cấp công nhân thực hiện sứ mệnh lịch sử.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-17", topic: "role",
    question: "Xây dựng giai cấp công nhân cần phát triển những mặt nào?",
    options: ["Cả số lượng và chất lượng", "Chỉ số lượng người", "Chỉ số năm làm việc", "Chỉ số giờ tăng ca"],
    correctAnswerIndex: 0,
    explanation: "Chương 2 yêu cầu phát triển cả số lượng và chất lượng, trong đó có nhận thức chính trị và năng lực làm chủ công nghệ.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-18", topic: "role",
    question: "Theo Chương 2, sứ mệnh lịch sử của công nhân hướng tới mục tiêu nào?",
    options: ["Xóa bỏ áp bức, bóc lột và xây dựng xã hội mới", "Duy trì áp bức người lao động", "Ngăn cản tiến bộ xã hội", "Bảo vệ đặc quyền của giới bóc lột"],
    correctAnswerIndex: 0,
    explanation: "Theo chủ nghĩa Mác - Lênin, sứ mệnh đó hướng tới giải phóng người lao động, xây dựng chủ nghĩa xã hội và chủ nghĩa cộng sản.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-19", topic: "role",
    question: "Giai cấp công nhân hình thành và phát triển gắn với nền sản xuất nào?",
    options: ["Nền đại công nghiệp", "Nền kinh tế săn bắt", "Nền sản xuất tự cấp tự túc", "Nền nông nghiệp phong kiến"],
    correctAnswerIndex: 0,
    explanation: "Giai cấp công nhân là sản phẩm và chủ thể của nền đại công nghiệp, gắn với sản xuất công nghiệp hiện đại.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-20", topic: "role",
    question: "Theo Chương 2, giai cấp công nhân góp phần xây dựng những giá trị nào?",
    options: ["Công bằng, dân chủ và bình đẳng", "Đặc quyền và phân biệt đối xử", "Áp bức và bất công", "Ích kỷ và chia rẽ"],
    correctAnswerIndex: 0,
    explanation: "Hệ giá trị được nêu trong Chương 2 gồm lao động, công bằng, dân chủ, bình đẳng và tự do.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-21", topic: "vietnam",
    question: "Công nhân Việt Nam đi đầu trong sự nghiệp nào?",
    options: ["Công nghiệp hóa, hiện đại hóa đất nước", "Quay lại sản xuất thủ công lạc hậu", "Thu hẹp ứng dụng khoa học", "Tách đất nước khỏi kinh tế thế giới"],
    correctAnswerIndex: 0,
    explanation: "Giai cấp công nhân là lực lượng đi đầu trong công nghiệp hóa, hiện đại hóa gắn với kinh tế tri thức.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-22", topic: "vietnam",
    question: "Tổ chức nào đại diện, chăm lo và bảo vệ quyền lợi của công nhân Việt Nam?",
    options: ["Công đoàn", "Câu lạc bộ du lịch", "Hội người sưu tầm tem", "Ban tổ chức giải thể thao"],
    correctAnswerIndex: 0,
    explanation: "Theo gợi ý thuyết trình, Công đoàn đại diện, chăm lo và bảo vệ quyền, lợi ích hợp pháp, chính đáng của người lao động.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-23", topic: "vietnam",
    question: "Nghị quyết 20-NQ/TW được nhắc trong bài thuyết trình tập trung vào nội dung gì?",
    options: ["Xây dựng giai cấp công nhân Việt Nam", "Phát triển du lịch biển", "Bảo tồn di tích cổ", "Tổ chức thi đấu thể thao"],
    correctAnswerIndex: 0,
    explanation: "Gợi ý của thầy nêu Nghị quyết 20-NQ/TW về xây dựng giai cấp công nhân Việt Nam trong thời kỳ đẩy mạnh công nghiệp hóa, hiện đại hóa.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-24", topic: "vietnam",
    question: "Ví dụ nào phù hợp khi liên hệ công nhân Việt Nam trong bài thuyết trình?",
    options: ["Công nhân trong khu công nghiệp, nhà máy FDI", "Du khách đi tham quan", "Khán giả xem bóng đá", "Người tham gia lễ hội"],
    correctAnswerIndex: 0,
    explanation: "Công nhân trong khu công nghiệp và doanh nghiệp có vốn đầu tư nước ngoài (FDI) là ví dụ được gợi ý trong đề cương.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-25", topic: "vietnam",
    question: "Công nhân trong nhà máy công nghệ cao cần rèn luyện điều gì?",
    options: ["Kỹ năng công nghệ và kỷ luật lao động", "Thói quen làm việc tùy hứng", "Sự ngại học hỏi", "Thói quen bỏ qua quy trình"],
    correctAnswerIndex: 0,
    explanation: "Trình độ chuyên môn, kỹ năng công nghệ và tác phong công nghiệp giúp công nhân đáp ứng yêu cầu sản xuất hiện đại.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-26", topic: "vietnam",
    question: "Theo Chương 2, công nhân Việt Nam bao gồm những người làm công hưởng lương nào?",
    options: ["Cả lao động chân tay và trí óc trong lĩnh vực có tính công nghiệp", "Chỉ người làm việc chân tay", "Chỉ người làm việc trong hầm mỏ", "Chỉ người không được học nghề"],
    correctAnswerIndex: 0,
    explanation: "Định nghĩa bao gồm lao động chân tay và trí óc làm công hưởng lương trong sản xuất, kinh doanh, dịch vụ công nghiệp hoặc có tính chất công nghiệp.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-27", topic: "vietnam",
    question: "Công nhân Việt Nam liên minh chặt chẽ với những lực lượng nào?",
    options: ["Nông dân và đội ngũ trí thức", "Địa chủ và quý tộc phong kiến", "Chủ nô và lãnh chúa", "Các thế lực thực dân"],
    correctAnswerIndex: 0,
    explanation: "Chương 2 nhấn mạnh liên minh công nhân, nông dân và đội ngũ trí thức dưới sự lãnh đạo của Đảng.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-28", topic: "vietnam",
    question: "Xây dựng giai cấp công nhân Việt Nam lớn mạnh là trách nhiệm của ai?",
    options: ["Cả hệ thống chính trị, xã hội và bản thân công nhân", "Chỉ riêng từng công nhân", "Chỉ riêng chủ nhà máy", "Chỉ riêng trường dạy nghề"],
    correctAnswerIndex: 0,
    explanation: "Cần sự tham gia của cả hệ thống chính trị, toàn xã hội cùng nỗ lực vươn lên của mỗi công nhân.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-29", topic: "vietnam",
    question: "Giải pháp nào giúp nâng cao chất lượng đội ngũ công nhân Việt Nam?",
    options: ["Đào tạo và bồi dưỡng trình độ, tay nghề", "Cắt giảm việc học nghề", "Ngừng cập nhật công nghệ", "Chỉ kéo dài giờ làm việc"],
    correctAnswerIndex: 0,
    explanation: "Đào tạo, bồi dưỡng và nâng cao trình độ mọi mặt, đặc biệt cho công nhân trẻ, là giải pháp được nêu trong Chương 2.",
    difficulty: "easy",
  },
  {
    id: "cn4-v2-30", topic: "vietnam",
    question: "Công nghiệp hóa, hiện đại hóa ở Việt Nam hướng tới mục tiêu nào?",
    options: ["Dân giàu, nước mạnh, dân chủ, công bằng, văn minh", "Duy trì nghèo nàn và lạc hậu", "Chỉ phục vụ lợi ích của một nhóm nhỏ", "Giảm cơ hội phát triển của người lao động"],
    correctAnswerIndex: 0,
    explanation: "Đây là mục tiêu được nêu trong phần sứ mệnh lịch sử của giai cấp công nhân Việt Nam.",
    difficulty: "easy",
  },
];

function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
  const shuffledOptions = question.options.map((option, index) => ({ index, option }));
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  return {
    ...question,
    options: shuffledOptions.map(({ option }) => option),
    correctAnswerIndex: shuffledOptions.findIndex(({ index }) => index === question.correctAnswerIndex),
  };
}

export function getRandomQuestion(excludedIds: string[] = []): QuizQuestion | null {
  if (quizQuestions.length === 0) return null;

  const excluded = new Set(excludedIds);
  const unseen = quizQuestions.filter((question) => !excluded.has(question.id));
  const available = unseen.length > 0 ? unseen : quizQuestions;

  // Balance all three presentation sections, starting with AI/robot.
  // Count known questions only, so legacy IDs and duplicates do not skew selection.
  const topic = questionTopics
    .map((topic) => ({
      topic,
      count: unseen.length > 0
        ? quizQuestions.filter((question) => question.topic === topic && excluded.has(question.id)).length
        : 0,
    }))
    .filter(({ topic }) => available.some((question) => question.topic === topic))
    .sort((a, b) => a.count - b.count)[0].topic;
  const pool = available.filter((question) => question.topic === topic);
  return shuffleQuestionOptions(pool[Math.floor(Math.random() * pool.length)]);
}
