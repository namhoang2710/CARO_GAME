# Caro Quiz Battle

> **Bản phiên chơi hiện tại:** xem [SCORE-HISTORY.md](SCORE-HISTORY.md) để triển khai lịch sử điểm cá nhân và [SESSION-FIXES.md](SESSION-FIXES.md) cho luật một ván mỗi phiên. Schema hiện dùng là `supabase/01-session-game.sql` rồi `supabase/02-private-score-history.sql`. Hướng dẫn leaderboard toàn cục bên dưới là tài liệu cũ, không dùng để cài bản phiên chơi mới.

Mini game cuối bài thuyết trình: người chơi nhập tên, đánh caro 15x15 với bot, trả lời quiz lấy từ nội dung, chọn thẻ bài điểm số và cập nhật điểm lên leaderboard Supabase realtime.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Database
- Supabase Realtime
- Deploy target: Vercel

## Cài dependency

Từ root repo:

```bash
npm install
```

Hoặc trong workspace app:

```bash
npm install --workspace hcm-ethics
```

## Tạo Supabase project

1. Tạo project mới trên Supabase.
2. Vào SQL Editor.
3. Chạy toàn bộ nội dung trong `supabase/schema.sql`.
4. Bảo đảm Realtime bật cho table `scores`. File SQL đã có dòng `alter publication supabase_realtime add table public.scores;`. Nếu Supabase báo table đã được thêm vào publication, có thể bỏ qua.

File SQL cũng tạo các RPC:

- `get_leaderboard`: lấy bảng xếp hạng realtime và gom mỗi tên người chơi thành một hạng duy nhất.
- `upsert_player_score`: cập nhật điểm realtime của người chơi trong lúc đang chơi, không tạo nhiều dòng trùng tên.
- `apply_score_card_target_effect`: xử lý lá Cướp điểm và Chia điểm với đối thủ được chọn trên leaderboard.
- `clear_leaderboard`: xóa toàn bộ bảng xếp hạng khi người thuyết trình cần reset game.

Client không cần quyền update/delete trực tiếp; các RPC server-side sẽ cập nhật điểm an toàn hơn.

Nếu bấm `Xóa data BXH` và Supabase báo `DELETE requires a WHERE clause`, hoặc sau khi thêm pass xóa BXH, chạy file `supabase/fix-clear-leaderboard.sql` trong SQL Editor để cập nhật lại RPC `clear_leaderboard` và chỉ cho service role được gọi hàm xóa.
Nếu dùng thẻ `Cướp 30%/50%/70%/100%`, chạy file `supabase/fix-card-percent-effects.sql` trong SQL Editor để cập nhật RPC tính phần trăm. File này cũng reload schema cache để xử lý lỗi `Could not find the function public.apply_score_card_target_effect(...) in the schema cache`.

## Thêm env

Copy `.env.example` thành `.env.local` trong thư mục `hcm-ethics`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GAME_URL=https://hcm-pro-black.vercel.app/game
SUPABASE_SERVICE_ROLE_KEY=
LEADERBOARD_CLEAR_PASSWORD=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/auto
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Chỉ dùng anon key ở client. Không đưa `SUPABASE_SERVICE_ROLE_KEY` vào frontend.
`SUPABASE_SERVICE_ROLE_KEY` và `LEADERBOARD_CLEAR_PASSWORD` chỉ dùng ở server để xác thực nút `Xóa data BXH`; không thêm tiền tố `NEXT_PUBLIC_`.
`NEXT_PUBLIC_SUPABASE_URL` nên là URL project gốc dạng `https://xxxx.supabase.co`, không cần thêm `/rest/v1`. App vẫn tự chuẩn hóa nếu lỡ nhập URL có `/rest/v1`.
`NEXT_PUBLIC_GAME_URL` là link QR trên màn hình presenter; hiện đang trỏ tới `https://hcm-pro-black.vercel.app/game`.
`OPENROUTER_API_KEY` chỉ chạy ở server qua `/api/presentation-chat`; nếu có key này, chatbot sẽ ưu tiên OpenRouter. `OPENROUTER_MODEL` mặc định là `openrouter/auto`.
`OPENAI_API_KEY` chỉ chạy ở server qua `/api/presentation-chat`, không được thêm tiền tố `NEXT_PUBLIC_`. Nếu chưa cấu hình OpenRouter/OpenAI, chatbot chỉ dùng fallback nội bộ cho một số câu hỏi cục bộ.

Nếu chưa cấu hình Supabase, game vẫn chơi được. Leaderboard sẽ hiển thị trạng thái `Chưa kết nối Supabase`.

## Chạy local

Từ root repo:

```bash
npm run dev
```

Mở `http://localhost:3000`.

Các route chính:

- `/`: bài thuyết trình chính
- `/game`: nhập tên và bắt đầu mini game
- `/play`: caro quiz battle
- `/leaderboard`: top 10 realtime
- `/presenter`: QR code dẫn tới `/game` và top 5 realtime cho slide cuối

## Build

```bash
npm run build
```

## Deploy Vercel

1. Import repo vào Vercel.
2. Nếu Vercel hỏi root directory, chọn `hcm-ethics` hoặc giữ root repo và dùng npm workspace scripts hiện có.
3. Thêm env:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` bằng URL Vercel public.
   - `NEXT_PUBLIC_GAME_URL` bằng `https://hcm-pro-black.vercel.app/game` để QR dẫn đúng trang chơi.
   - `SUPABASE_SERVICE_ROLE_KEY` để server gọi RPC xóa bảng xếp hạng.
   - `LEADERBOARD_CLEAR_PASSWORD` là pass cần nhập trước khi xóa data BXH.
   - `OPENROUTER_API_KEY` để bật chatbot AI qua OpenRouter.
   - `OPENROUTER_MODEL` tùy chọn, mặc định `openrouter/auto`.
   - `OPENAI_API_KEY` để bật chatbot AI cho trang thuyết trình.
   - `OPENAI_MODEL` tùy chọn, mặc định `gpt-4o-mini`.
4. Deploy.

Nếu deploy từ root repo, `vercel.json` ở root đã trỏ build về workspace `hcm-ethics`. Nếu chọn root directory là `hcm-ethics` trong Vercel, Vercel sẽ dùng `hcm-ethics/vercel.json`.

## Gameplay

- Người chơi là X, bot là O.
- Bàn 15x15, thắng khi có 5 quân liên tiếp ngang, dọc hoặc chéo.
- Sau mỗi 3 lượt người chơi, game mở quiz.
- Trả lời đúng: +30 điểm và mở 3 lá bài úp mặt để chọn hiệu ứng điểm.
- Lá Cướp điểm và Chia điểm yêu cầu bấm trực tiếp một người trên leaderboard realtime.
- Lá Cướp điểm có mức 30%, 50%, 70%, 100%; lá Mất điểm cũng có mức 30%, 50%, 70%, 100%.
- Lá Đóng băng có thể khóa sàn của bạn hoặc làm chậm bot trong 8 giây.
- Trả lời sai: mất 50% điểm hiện tại và bot được ưu tiên nước mạnh hơn lượt kế tiếp.
- Thắng bot: +100 điểm.
- Hòa: +50 điểm.
- Thua: +20 điểm.
- Thắng dưới 15 lượt: bonus +50 điểm.
- Tổng điểm không nhỏ hơn 0.

## Code structure

```text
src/app/page.tsx
src/app/game/page.tsx
src/app/play/page.tsx
src/app/leaderboard/page.tsx
src/app/presenter/page.tsx
src/components/GameBoard.tsx
src/components/QuizModal.tsx
src/components/Leaderboard.tsx
src/components/QRCodeJoin.tsx
src/lib/supabaseClient.ts
src/lib/gameLogic.ts
src/lib/botLogic.ts
src/lib/scoring.ts
src/data/questions.ts
supabase/schema.sql
.env.example
```
