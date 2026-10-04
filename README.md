# Tán Hợp

> Synced from Lovable to GitHub — live two-way sync test: 2026-10-04 07:32 UTC.


Build (or fully redesign) the mobile-first web app "TánGPT" with ALL UI text in Vietnamese. Target users: Vietnamese men aged 20-35 who live in cities, use Zalo, TikTok, Instagram and Facebook daily, and want to (1) get help writing charming replies to women and (2) chat with a realistic AI companion. The look must feel like a modern Vietnamese Gen Z / young-professional app: Sài Gòn night energy meets Hà Nội café cool. NOT corporate, NOT childish, NOT generic Western dating-app. Think Zalo/Momo/TikTok polish with a premium dark mood.

=== DESIGN SYSTEM ===

Font: "Be Vietnam Pro" (Google Fonts) for everything, weights 400/500/600/700/800. Vietnamese diacritics must render perfectly everywhere. Headlines bold and tight, body 15-16px, generous line height.

Base colors (dark theme only):

- background #0B0B10

- surface #15151D

- surface-raised #1D1D28

- border #2A2A38

- text-primary #F5F2EC

- text-muted #9A98A8

- danger #FF5A5F, success #3DDC97

Default accent gradient: coral to pink (#FF6B6B to #FF3D8B).

REGION THEMES (the whole app's accent, glow, chat bubble color and illustrations switch to the chosen region, with a smooth 300ms transition):

- Miền Bắc / Hà Nội: jade teal #2FBFA5 with warm cream #F3E9D2 highlights. Mood: phố cổ, cà phê trứng, vintage tinh tế.

- Miền Nam / Sài Gòn: neon magenta #FF3D8B with amber #FFB020. Mood: đêm Sài Gòn, rooftop, đèn neon, sôi động.

- Miền Trung / Huế - Đà Nẵng: imperial gold #E3B04B with deep indigo #3B4CCA. Mood: cố đô, biển, trầm và duyên.

- Miền Tây: lotus pink #FF7BAC with leaf green #5FD38D. Mood: sông nước, chợ nổi, hiền hậu, ấm áp.

Style rules: rounded corners (16-24px), soft glow shadows tinted with the region accent, subtle grain texture overlay on the background at 3% opacity, glassmorphism for the bottom nav and modals (blur + translucent surface), smooth micro-animations (spring taps, fade-up on cards), thumb-friendly 48px minimum tap targets, safe-area padding for iPhone. Icons: Lucide, stroke style. Illustrations: simple minimal line-art SVGs in the region accent color (no stock photos, no cartoon mascots).

Vietnamese voice for microcopy: friendly, casual, a bit witty, like a smart older brother. Use "bạn/mình" in the UI. Short sentences.

=== SCREENS ===

1) LANDING PAGE "/"

- Sticky top bar: logo "TánGPT" + button "Đăng nhập".

- Hero: headline "Nhắn tin duyên dáng, đúng chất vùng miền của em ấy". Subheadline "Trợ lý AI giúp bạn nhắn tin tự nhiên như người bản xứ: Bắc, Trung, Nam hay Miền Tây." Primary button "Dùng thử miễn phí" (go to /login), secondary "Xem demo".

- A live-looking phone mockup (pure CSS/SVG) showing a Zalo-style chat where the same message from her gets three different replies, switching automatically every 3 seconds between Bắc, Nam and Trung tabs, each with its region color. Example her message: "Nay đi làm về mệt quá à". Bắc reply: "Vất vả quá nhỉ, về nhà nghỉ ngơi đi nhé. Đã ăn gì chưa đấy?" Nam reply: "Trời, mệt dữ vậy hả. Về tắm cái rồi ăn gì đó ngon ngon đi nè." Trung reply: "Mệt rứa hả em, nghỉ ngơi đi nghe, ăn chi chưa rứa?"

- Section "Hai cách dùng": card 1 "Gợi ý trả lời", card 2 "Bạn gái AI" (with a small "AI" badge and text "Nhân vật AI, trò chuyện tự nhiên và luyện tập giao tiếp").

- Section "Chọn vùng miền": 4 region cards as a preview.

- Section "Vì sao khác biệt": three points: "Đúng giọng vùng miền", "Hợp lứa tuổi 18-26, 27-35, 36+", "Giải thích vì sao câu này hiệu quả".

- Footer: "TánGPT khuyến khích giao tiếp chân thành và tôn trọng. Nhân vật AI chỉ mang tính giải trí và luyện tập." plus links Điều khoản, Quyền riêng tư.

2) LOGIN "/login": email + password with toggle "Đăng nhập" / "Đăng ký", Vietnamese error messages, Google button placeholder.

3) ONBOARDING (first login only, 3 short steps with progress dots):

 Step A, age gate: "Ứng dụng dành cho người từ 18 tuổi trở lên." checkbox "Tôi xác nhận tôi đủ 18 tuổi" (saves profiles.age_confirmed = true).

 Step B, REGION PICKER (the hero moment): title "Em ấy đến từ đâu?" with 4 large tappable cards, each with a region illustration, the region name, a one-line vibe in that region's own dialect, and the theme color. Selecting a card instantly re-themes the entire screen.

   - Miền Bắc: "Nhẹ nhàng, tinh tế nhé."

   - Miền Nam: "Thoải mái, chân chất nha."

   - Miền Trung: "Dịu dàng, đậm đà nghe."

   - Miền Tây: "Hiền hậu, hào sảng nghen."

   After choosing a region, show a second row of city chips:

   - Bắc: Hà Nội, Hải Phòng, Nam Định, Thái Nguyên

   - Nam: Sài Gòn, Biên Hòa, Vũng Tàu, Bình Dương

   - Trung: Huế, Đà Nẵng, Nha Trang, Nghệ An, Hà Tĩnh, Quy Nhơn

   - Tây: Cần Thơ, Bến Tre, Vĩnh Long, An Giang

   Save default_region and default_city.

 Step C, her age group: "Em ấy khoảng bao nhiêu tuổi?" chips "18-26", "27-35", "36+".

4) APP SHELL "/app" with a glassmorphism bottom navigation of 4 tabs: "Gợi ý" (reply helper), "Bạn gái AI", "Lịch sử", "Tôi". A small region chip in the top bar (tap to change region and city; the theme switches live).

5) GỢI Ý TAB: two segmented modes "Trả lời tin nhắn" and "Mở lời". Region chips + city chips + age chips at the top (prefilled from onboarding), big textarea (placeholder reply: "Dán tin nhắn của em ấy vào đây..."; opener: "Mô tả profile, bio hoặc ảnh của em ấy..."), large gradient button "Gợi ý cho tôi". Results: 3 cards ("Vui vẻ", "Chân thành", "Tự tin") each styled like a chat bubble in the region color, with a "Sao chép" button (changes to "Đã sao chép" for 2s), a small muted "Vì sao hiệu quả: ..." line, then a "Mẹo" box and a "Tạo lại" button. For now MOCK the data with a 1.5s delay and this shape: { options: [{style, text, why}], tip }, structured so it can be swapped for supabase.functions.invoke("rizz", { body: { mode, region, city, age_group, input_text } }). Handle error "limit_reached" with the paywall modal below.

6) BẠN GÁI AI TAB:

 - If the user has no companion: show "Chọn người bạn trò chuyện" with a horizontal carousel of 8 persona cards filtered by the selected region (the user can switch region at the top). Each card shows an avatar (soft gradient circle with the initial letter, no real-person photos), name, age, city, job, 3 personality tags, and a "Nhân vật AI" badge. Personas:

   Bắc: Thảo, 24, Hà Nội, designer, "tinh tế, hay cà phê phố cổ"; Hằng, 27, Hà Nội, nhân viên ngân hàng, "chín chắn, duyên ngầm"; Lan, 23, Hải Phòng, sinh viên, "thẳng tính, dễ thương".

   Nam: Trâm, 23, Sài Gòn, marketing, "năng động, mê trà sữa và rooftop"; Vy, 26, Sài Gòn, kế toán, "hài hước, hay trêu"; Nhi, 22, Vũng Tàu, làm ở quán cà phê, "hiền, thích biển".

   Trung: Ngọc, 25, Huế, giáo viên, "dịu dàng, e ấp"; My, 24, Đà Nẵng, hướng dẫn viên du lịch, "thẳng, vui, hay đi phượt".

   Tây: Mai, 22, Cần Thơ, sinh viên, "hiền, hào sảng"; Út, 24, Bến Tre, chủ shop online, "vui tính, nói chuyện dễ thương".

 - Selecting a persona opens a short confirm sheet: name, region, personality (Dịu dàng / Tinh nghịch / Chín chắn), mode ("Trò chuyện" or "Luyện tập tán tỉnh"), then "Bắt đầu nhắn tin". Save to the companions table (name, region, age_vibe, personality, mode). Also store city and persona job in memory_summary's initial text as: "Nhân vật: {job}, sống ở {city}."

 - If a companion exists, this tab shows the chat list Zalo-style (avatar, name, last message preview, time) and a "+" button to add another persona.

7) CHAT SCREEN "/app/chat/:companionId": build it exactly as described in the NEXT prompt. For now create the route with the header only.

8) LỊCH SỬ TAB: past reply-helper generations (newest first) with copy buttons.

9) TÔI TAB: region/city default, subscription status ("Miễn phí" / "Pro"), "Xóa lịch sử trò chuyện", "Đăng xuất", terms and privacy links.

10) PAYWALL MODAL (glass sheet): "Bạn đã dùng hết lượt hôm nay" with two plan cards "Miễn phí" and "Pro 149.000đ/tháng" listing: nhắn không giới hạn, nhiều nhân vật, trí nhớ dài hơn, gợi ý không giới hạn. Button "Nâng cấp Pro (sắp có)" disabled for now. Never show the paywall inside the chat bubbles themselves, only as a modal.

Keep the code componentized: components/RegionPicker, RegionTheme provider (CSS variables for accent colors driven by the selected region), PersonaCard, ChatBubble, Paywall. Do not put any API keys in the frontend.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ngon-ngu-mien-tay.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2dab5394-8b3a-4c28-b24c-cd1b4ad61687).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
