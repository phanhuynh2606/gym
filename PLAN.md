# Plan triển khai: Gym Website (Next.js 15)

> Repo `phanhuynh2606/gym` hiện chỉ có 2 file design markdown, **chưa có code**. Đây là project **greenfield**: cần scaffold toàn bộ Next.js app từ đầu.

---

## ✅ Đã chốt với anh

- [x] **Next.js 15+** App Router, TS strict, Turbopack.
- [x] Route group `(home)` (thay vì `(marketing)`).
- [x] **Clerk SDK + Mongoose + SEO nâng cao** từ PR #1.
- [x] Credentials qua `.env` local (em tạo `.env.example`, anh tự fill).
- [x] Tone Contentful sky blue (`#0286C3`).

---

## 1. Tech stack

| Layer | Lựa chọn |
|---|---|
| Framework | Next.js 15+ App Router, TypeScript (strict), Turbopack |
| Styling | Tailwind CSS + CSS variables |
| UI components | shadcn/ui (customize theo Contentful tokens) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Database | MongoDB + Mongoose |
| Auth | Clerk |
| Forms | react-hook-form + Zod |
| Charts | Recharts |
| Date | dayjs |
| Hosting | Vercel + MongoDB Atlas |

---

## 2. Breakdown từng PR

### PR #1 — Foundation + Design System + Home + Browse pages (~2 ngày)

- Scaffold Next.js 15 (App Router, TS strict, Turbopack, ESLint).
- Route group `(home)`.
- Cài deps: shadcn/ui, Tailwind, Framer Motion, Lucide, Recharts, Mongoose, Clerk SDK, Zod, react-hook-form, dayjs.
- Design tokens Contentful + custom shadcn Button variants (primary / secondary / positive / negative).
- Layout: TopBar 56px white + Sidebar 240px dark navy `#1B1E28` + AppShell + Footer + MobileNav.
- Mongoose models đầy đủ + `lib/mongodb.ts` với `global.mongoose` cache.
- Clerk middleware + ClerkProvider (scaffold, route protection đến PR #3).
- Seed: ~30 bài tập + 2 giáo án `nu-giam-can` & `nam-moi-tap` theo §6.3, §6.4.
- Trang: `/`, `/giao-an`, `/giao-an/nu-giam-can`, `/giao-an/nam-moi-tap`, `/bai-tap`, `/bai-tap/[slug]`, `/nhom-co`, `/nhom-co/[muscle]`, `/dinh-duong`.
- **SEO nâng cao**: dynamic `generateMetadata`, `sitemap.ts`, `robots.ts`, JSON-LD (`WebSite` + `Organization` + `HowTo` + `Article` + `BreadcrumbList`), canonical, OG + Twitter, dynamic OG image, `manifest.ts`, `lang="vi"`.
- `.env.example` + README + GitHub Actions CI.

### PR #2 — Workout Interactivity + Calendar (~1 ngày)

- `ProgressChecklist` + Server Action `logExerciseSet`.
- `RestTimer` (45/60/90s + custom + sound).
- `WorkoutSessionTabs` (nữ) + Accordion (nam).
- `/lich-tap` calendar tuần.
- Filter nâng cao `/bai-tap` (debounce, URL params, localStorage).

### PR #3 — Auth + Daily Dashboard + Todo (~1.5 ngày)

- Bật Clerk auth thật cho `/hom-nay`, `/todo`, `/tien-do`, `/yeu-thich`, `/tong-ket-thang`, `/admin/**`.
- Clerk webhook → sync User MongoDB.
- Onboarding: chọn mục tiêu → enroll plan → auto-generate 1 tháng `DailyTodo`.
- `/hom-nay`, `/todo`.
- Server actions: `toggleTodoTask`, `saveDailyMetrics`, `enrollPlan`, `generateMonthlyTodos`.

### PR #4 — Progress Tracking + Charts + Favorites (~1 ngày)

- `/tien-do` Recharts (weight, measurements, volume, exercise PR).
- `/yeu-thich`.
- API: `/api/progress/me`, `/api/today`.

### PR #5 — Monthly Review + Auto Suggestions (~1.5 ngày)

- `/tong-ket-thang` với logic §7.10.
- Vercel Cron auto-generate.
- Gợi ý giáo án tháng sau.

### PR #6 — Admin CMS + Media (~1.5 ngày)

- `/admin/exercises`, `/admin/workout-plans`, `/admin/media` CRUD.
- Cloudinary signed upload.
- `/api/youtube/search` admin-only.
- Role-based qua Clerk `publicMetadata.role`.

### PR #7 — Onboarding wizard + personalised plan recommendation (~1 ngày)

- `/onboarding` 4-step wizard (gender / goal / level + equipment / body stats).
- Auto-redirect khi user mới đăng nhập (chưa có `onboardingCompletedAt`).
- Personalised plan recommendation theo gender/goal/level/equipment.
- `?redo=1` để user cập nhật lại sau.

### PR #8 — AI workout coach (LLM + rule-based fallback) (~1.5 ngày)

- `/coach` chat UI với context cá nhân (profile + 30-day progress + plan).
- OpenAI-compatible wire format (`OPENAI_API_KEY`, `OPENAI_BASE_URL`).
- Rule-based fallback khi không có key — 9 topic (motivation, plateau, nutrition, ...).
- `CoachMessage` model lưu lịch sử, page load 50 message gần nhất.

### PR #9 — Notification + Reminder (~1 ngày)

- `Notification` model (in-app, dedupeKey để tránh spam).
- `/thong-bao` list + mark-as-read / mark-all-read.
- `/cai-dat` reminder preferences (giờ + email opt-in + auto-detect timezone).
- Bell icon trong TopBar với unread badge (server-rendered count).
- `/api/cron/send-reminders` chạy mỗi giờ (vercel.json), trigger theo timezone user.
- Resend email (optional, graceful 503 khi không có `RESEND_API_KEY`).

### PR #10 — Social profiles + leaderboard + share (~1 ngày)

- User model thêm `profileSlug` (unique among non-null) + `profileVisibility` + `profileBio`.
- `/u/[slug]` public profile (opt-in) hiển thị stats 30 ngày (training days, streak hiện tại / dài nhất, completion, total volume).
- `/bang-xep-hang` leaderboard sort theo streak / volume / completion.
- Settings `/cai-dat` thêm Profile + Privacy section (slug picker, bio, visibility radio).
- Share button `navigator.share()` + clipboard fallback.
- Sitemap async, include public profiles + leaderboard.
- Snapshot redact body metrics, sleep/water, mood, individual sessions.

---

## 3. Design System (Contentful) → Tailwind

```ts
colors: {
  brand:   { DEFAULT: '#0286C3', dark: '#0073AA' },
  accent:  { teal: '#17B897' },
  text:    { primary: '#1B1E28', secondary: '#536171', muted: '#8DA4BE' },
  surface: { DEFAULT: '#FFFFFF', bg: '#F7F9FA' },
  border:  { DEFAULT: '#CFD9E0', subtle: '#E5EBED' },
  state:   { success: '#17B897', warning: '#F5A623', error: '#D32F2F', info: '#0286C3' },
}
borderRadius: { sm: '4px', md: '6px', full: '9999px' }
boxShadow: {
  raised:  '0 1px 2px rgba(0,0,0,0.10)',
  overlay: '0 4px 8px rgba(0,0,0,0.12)',
  modal:   '0 8px 24px rgba(0,0,0,0.15)',
}
```

- Sidebar dark navy `#1B1E28`, 240px, white text. TopBar 56px white.
- Focus ring: `border-brand` + `shadow 0 0 0 3px rgba(2,134,195,0.2)`.
- WCAG 2.1 AA, touch target ≥ 44×44px.
- Responsive: Mobile <768px (bottom nav), Tablet 768-1023 (sidebar icon-rail), Desktop ≥1024 (full sidebar).

---

## 4. Database models (§9-10 spec)

- `Exercise`, `WorkoutPlan` (sessions[] → SessionExercise[]), `DailyTodo` (compound unique `(userId, date)`), `ProgressLog`, `MonthlyReview`, `User`.
- `lib/mongodb.ts` pattern `global.mongoose` cache.

---

## 5. Rủi ro & lưu ý

- Avenir Next có license → fallback Inter Google Font.
- Anh tự điền `.env` từ `.env.example`. Em không commit `.env`.
- PR #1 dùng placeholder Lucide icon thay ảnh bài tập.
- Strict TypeScript — không dùng `any`.

---

Em bắt đầu PR #1 ngay.
