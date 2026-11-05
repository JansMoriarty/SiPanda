# SiPanda Design System v2 (reference: "Elearn" soft dashboard)

Mood: soft, airy, rounded, pastel. No hard borders, depth comes from very soft shadows and surface contrast.

## Tokens (Tailwind v4 @theme)
--color-canvas: #EEEEF4      /* page background, light lavender-gray */
--color-surface: #FFFFFF     /* cards */
--color-ink: #2B2840         /* headings, primary text (deep navy-purple) */
--color-muted: #A3A1B5       /* secondary text, inactive icons */
--color-brand: #3F3A5A       /* dark purple: hero banner, logo, primary buttons */
--color-peach: #F3A183       /* accent: active highlight, line chart, "View all" links, selected date */
--color-peach-soft: #FBD9CC
--color-lavender: #B7A6E6    /* secondary accent: area chart, bars */
--color-lavender-soft: #E9E3FA
--color-sage: #8FCBC3        /* tertiary accent for icon chips */

Radius: shell 32px, cards 20-24px, inputs/buttons 12-14px, pills/chips full.
Shadow (card): 0 10px 30px rgba(63,58,90,0.06). Hover: 0 14px 36px rgba(63,58,90,0.10).
Card: bg surface, NO border, padding 20-24px.
Font weight: headings 600, body 400-500. Small labels 11-12px muted.

## Layout
- Page bg = canvas. App content sits inside one big rounded container (radius 32px, soft shadow, slight inset margin).
- Sidebar: no border, same surface as the shell. Nav item inactive = muted icon + muted text.
  Active item = white pill with soft shadow, ink text, ink icon. Item radius 14px.
- Sidebar bottom: promo/upgrade card (small illustration, short title, subtitle, small dark round arrow button).
- Header: search input (rounded 14px, light border, muted placeholder, icon left),
  notification bell with small peach dot badge, avatar rounded-xl on the right.
- Dashboard = 3 zones: main column (hero banner, charts), right panel (calendar + list).

## Components
- Hero banner: bg brand, radius 24px, white title (bold), small muted-white subtitle,
  small white pill CTA button (text brand), illustration on right (decorative, can use abstract blobs/shapes if no illustration).
- Stat/chart card: title ink 600, optional "View all" peach text link top-right.
- Area/line chart: smooth curves; series 1 = peach line, series 2 = lavender line + lavender gradient fill (fade to transparent);
  light dashed horizontal grid; tooltip = peach rounded bubble with white bold value + dashed vertical guide.
- Bar chart: vertical pill bars (full radius) on a lavender-soft track, filled portion lavender/peach stacked; day labels muted below; active day label ink.
- Progress ring: donut, thin track lavender-soft, progress peach with round caps, big % in center, caption below.
- Calendar: month header with chevrons, weekday labels muted, selected day = peach filled circle, white text.
- List item (schedule style): white card radius 18px, left circular colored icon chip (peach/sage/lavender soft bg),
  title ink 600, meta muted small, right chevron.
- Buttons: primary = brand bg, white text, radius 12px; secondary = white, soft border.
- Badges: soft pastel bg + darker text of same hue (e.g. "Study pack siap" = sage-soft/sage-dark).
- Dark mode: keep existing toggle; define dark values for canvas (#15131F), surface (#1E1B2C), ink (#F1EFFA), muted (#8D8AA3); accents stay, shadows become subtle borders (1px rgba(255,255,255,0.06)).

## Mapping to SiPanda pages
- Dashboard:
  - "Selamat datang kembali" + "Cari materi" CTA -> hero banner
  - 4 stat cards (Materi, Quiz dikerjakan, Rata-rata skor, Mata kuliah) -> white cards with pastel icon chips
  - "Aktivitas minggu ini" -> pill-bar chart
  - Rata-rata skor vs target 70% -> progress ring
  - "Knowledge gap" -> right-panel card with thin rounded progress bars
  - "Lanjutkan belajar" -> schedule-style list items
  - Streak "1 hari beruntun" -> small peach chip in header/hero
- Materials: card grid, same card style; right storage panel uses progress ring.
- Sidebar "Pricing / HOT" -> upgrade card at bottom of sidebar.

## Rules
- Do NOT change routes, props, controllers, copy/text, or logic. Styling and markup structure only.
- Keep existing icon library, don't add new ones.
- Reuse shared components; no inline one-off styles.
- Full-file rewrites, but show me the current file first if it already exists.

## Dashboard layout (v2, matches the reference)
Two zones inside the shell content area. No stat card row.

Main column (flex-1, min-w-0, vertical gap 24px):
1. Hero banner
2. Score Statistic card (full width): area/line chart of average quiz score
3. Bottom row, grid about 2fr / 1fr:
   - Activity card (was "Aktivitas minggu ini"): vertical pill bars
   - Progress card (average score vs target 70%): donut ring
4. Knowledge gap card (full width, restyled later)

Right panel (340px on xl+, below xl it stacks after the main column):
1. Calendar card (month header + chevrons, selected/today = peach filled circle, days with study activity = small peach dot)
2. "Lanjutkan belajar" as a Schedule-style list (SectionHeader with "Lihat semua")

Widgets:
- Score Statistic: legend top right. Series "Skor" = peach line with a lavender gradient area under it.
  Dashed lavender horizontal line for the 70% target. Tooltip = peach rounded bubble with value + dashed vertical guide. Default range: last 7 days.
- Activity pill bars: full-radius bars on a lavender-soft track, filled part lavender (peach for today), day labels muted, today's label ink.
- Progress ring: thin track, peach progress with round caps, big % in the center, short caption below ("Target 70%").
- Schedule-style item: ui/Card (padding sm, hover), circular IconChip (size lg, tones cycle peach/sage/lavender),
  title ink 600 truncated, muted meta line, right side chevron.
- Removed stat info (Materi / Quiz dikerjakan / Mata kuliah counts) may return later as small captions; not now.