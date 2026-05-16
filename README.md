# GymVN — Hướng dẫn tập gym tiếng Việt

Website hướng dẫn tập gym cho nữ giảm cân và nam mới tập: giáo án 5 buổi/tuần, thư viện bài tập có video minh hoạ, theo dõi tiến độ và to-do hằng ngày.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, Server Actions)
- **Language**: TypeScript (strict)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) với design tokens Contentful Forma 36 (`#0286C3` sky blue, sidebar dark navy `#1B1E28`, Avenir Next / Inter fallback)
- **UI primitives**: [Radix UI](https://www.radix-ui.com) + [shadcn/ui](https://ui.shadcn.com) style components
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide](https://lucide.dev)
- **Charts**: [Recharts](https://recharts.org)
- **Database**: MongoDB Atlas + [Mongoose](https://mongoosejs.com)
- **Auth**: [Clerk](https://clerk.com)
- **Forms / Validation**: react-hook-form + zod

## Cấu trúc thư mục

```
app/                  # Next.js App Router
├─ (home)/            # Route group cho trang công khai
├─ (app)/             # Route group cho trang ứng dụng (có sidebar)
├─ sitemap.ts         # Sitemap động
├─ robots.ts          # robots.txt
├─ manifest.ts        # PWA manifest
├─ opengraph-image.tsx# Dynamic OG image
└─ icon.svg           # Favicon
components/
├─ layout/            # TopBar, Sidebar, AppShell, Footer, MobileNav
├─ ui/                # Primitives (Button, Card, Tabs, Accordion, ...)
├─ exercise/          # ExerciseCard, MuscleBadge, EquipmentBadge
├─ workout/           # WorkoutPlanCard
└─ seo/               # JsonLd, Breadcrumb
lib/
├─ constants.ts       # SITE_NAME, getBaseUrl(), nav configs
├─ mongodb.ts         # Mongoose connection (cached)
├─ seo.ts             # buildMetadata, JSON-LD builders
└─ utils.ts           # cn(), slugify(), formatRest()
models/               # Mongoose schemas
server/seed/          # Static seed data cho exercises + workout plans
types/                # TypeScript types + Vietnamese label maps
proxy.ts              # Clerk middleware (Next.js 16 convention)
```

## Bắt đầu

### Yêu cầu

- Node.js ≥ 22
- pnpm ≥ 10

### Cài đặt

```bash
pnpm install
cp .env.example .env.local
# điền MONGODB_URI và CLERK keys vào .env.local
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000).

### Biến môi trường

Xem `.env.example` cho danh sách đầy đủ. Tối thiểu cần:

| Biến                                | Mô tả                                                |
| ----------------------------------- | ---------------------------------------------------- |
| `MONGODB_URI`                       | MongoDB connection string                            |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key                                |
| `CLERK_SECRET_KEY`                  | Clerk secret key                                     |
| `NEXT_PUBLIC_APP_URL`               | Base URL (mặc định http://localhost:3000)            |

### Scripts

```bash
pnpm dev         # Chạy dev server
pnpm build       # Build production
pnpm start       # Chạy production server
pnpm lint        # ESLint
pnpm typecheck   # TypeScript check
pnpm format      # Prettier
```

## Lộ trình PR

| PR  | Nội dung                                                                                                                    | Status      |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| #1  | Foundation, design system, layout, models, SEO, các trang công khai (`/`, `/giao-an`, `/bai-tap`, `/nhom-co`, `/dinh-duong`) | Đang làm    |
| #2  | Workout interactivity (checklist, rest timer), bộ lọc nâng cao                                                              | Pending     |
| #3  | Daily dashboard, to-do, Clerk auth thực sự                                                                                  | Pending     |
| #4  | Progress charts, favorites                                                                                                  | Pending     |
| #5  | Monthly review + gợi ý giáo án                                                                                              | Pending     |
| #6  | Admin CMS, Cloudinary upload, YouTube search                                                                                | Pending     |

Xem chi tiết trong `PLAN.md`.

## Design system

Theo `DESIGN.md` (Contentful Forma 36):

- **Brand primary**: `#0286C3` (Sky Blue)
- **Sidebar background**: `#1B1E28` (Dark Navy)
- **Background**: `#F7F9FA`
- **Font**: Avenir Next → Inter → system-ui
- **Border radius**: 4px/6px
- **WCAG**: 2.1 AA compliant

Design tokens được khai báo trong `app/globals.css` qua `@theme inline` của Tailwind v4.

## License

MIT
