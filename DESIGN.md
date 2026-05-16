# Design System Inspired by Contentful

## 1. Visual Theme & Atmosphere

Contentful (Forma 36) is an enterprise CMS with a calm, structured visual language. Sky blue on white surfaces communicates reliability. The system is highly component-driven with deep accessibility support built in for diverse editorial teams.

**Key Characteristics:**
- Sky blue primary on clean white
- Enterprise-grade information density
- Avenir Next for warmth at scale
- Accessibility-first, WCAG 2.1 AA

## 2. Color Palette & Roles

### Primary
- **Brand Blue** (`#0286C3`): CTAs, links, active states
- **Blue Dark** (`#0073AA`): Hover states

### Accent Colors
- **Teal** (`#17B897`): Success highlights, content status

### Neutral Scale
- **Text Primary** (`#1B1E28`): Headings, body
- **Text Secondary** (`#536171`): Captions, metadata
- **Text Muted** (`#8DA4BE`): Placeholders

### Surface & Borders
- **Background** (`#F7F9FA`): App background
- **Surface** (`#FFFFFF`): Cards, panels
- **Border** (`#CFD9E0`): Input borders, dividers
- **Border Subtle** (`#E5EBED`): Section dividers

### Semantic / Status
- **Success** (`#17B897`): Published, done
- **Warning** (`#F5A623`): Draft, review needed
- **Error** (`#D32F2F`): Errors, blocked
- **Info** (`#0286C3`): Tips, notices

## 3. Typography Rules

### Font Family
Primary: Avenir Next, fallback: -apple-system, sans-serif

### Hierarchy
| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| H1 | Avenir Next | 32px | 700 | 1.2 | -0.01em | Page titles |
| H2 | Avenir Next | 24px | 600 | 1.3 | 0 | Section headings |
| H3 | Avenir Next | 18px | 600 | 1.4 | 0 | Card headings |
| Body | Avenir Next | 14px | 400 | 1.6 | 0 | UI body |
| Small | Avenir Next | 12px | 400 | 1.5 | 0 | Labels, meta |
| Button | Avenir Next | 14px | 500 | 1 | 0.01em | CTAs |
| Code | Mono | 13px | 400 | 1.6 | 0 | Code samples |

### Principles
- 14px body for dense editorial UI
- Avenir Next adds warmth to an otherwise corporate palette

## 4. Component Stylings

### Buttons
- **Primary**: bg `#0286C3`, text `#FFFFFF`, padding `8px 16px`, radius `4px`
- **Secondary**: bg `#FFFFFF`, border `1px solid #CFD9E0`, text `#1B1E28`
- **Positive**: bg `#17B897`, text `#FFFFFF`
- **Negative**: bg `#D32F2F`, text `#FFFFFF`

### Cards & Containers
- bg `#FFFFFF`, border `1px solid #E5EBED`, radius `6px`, padding `16px`

### Inputs & Forms
- Border `1px solid #CFD9E0`, radius `4px`, padding `8px 12px`
- Focus: border `#0286C3`, shadow `0 0 0 3px rgba(2,134,195,0.2)`

### Navigation
- Left sidebar `#1B1E28` dark, 240px, white text
- Top bar `#FFFFFF`, 56px, border-bottom `#E5EBED`

## 5. Layout Principles

### Spacing System
- **4px** — Tight label-icon gaps
- **8px** — Form field padding
- **12px** — Button padding
- **16px** — Card padding, field gaps
- **24px** — Section separation
- **32px** — Component blocks
- **48px** — Page sections

### Grid & Container
- Max width 1280px. Sidebar 240px + fluid content. 12-column grid, 16px gutters.

### Whitespace Philosophy
Enterprise users navigate large content models — whitespace groups related fields.

### Border Radius Scale
- **None** (0px): Table rows, full-width banners
- **Sm** (4px): Buttons, inputs, badges
- **Md** (6px): Cards, modals
- **Full** (9999px): Avatars, status chips

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | `none` | Tables, form fields |
| Raised | `0 1px 2px rgba(0,0,0,0.1)` | Cards |
| Overlay | `0 4px 8px rgba(0,0,0,0.12)` | Dropdowns |
| Modal | `0 8px 24px rgba(0,0,0,0.15)` | Dialogs |

## 7. Do's and Don'ts

### Do
- Use Forma 36 components — never build custom equivalents
- Follow WCAG 2.1 AA for all interactive elements
- Use status colors consistently: teal=published, amber=draft, red=error

### Don't
- Don't use Avenir Next below 12px
- Don't mix field validation styles — always show error below the field
- Don't add more than 3 actions to a toolbar

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | 0–767px | Single column, bottom nav |
| Tablet | 768–1023px | Collapsible sidebar |
| Desktop | 1024px+ | Full sidebar + content |

### Touch Targets
Minimum 44×44px for all interactive elements.

### Collapsing Strategy
Sidebar collapses to icon rail at tablet. Entry forms go single-column on mobile.

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: Brand Blue (`#0286C3`)
- App Background: Off-white (`#F7F9FA`)
- Surface: White (`#FFFFFF`)
- Text: Dark Navy (`#1B1E28`)
- Border: Light Gray (`#CFD9E0`)
- Success/Published: Teal (`#17B897`)

### Iteration Guide
1. Radius is 4px for interactive elements — tighter than most modern SaaS
2. Dark sidebar is `#1B1E28`, not the brand blue
3. Published = teal, draft = amber — never swap these
4. All form labels sit above the field
5. Use Forma 36 icon set for all iconography