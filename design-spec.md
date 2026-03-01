# Verifast VoC Analytics Dashboard
## Comprehensive UI/UX Design Specification

**Product:** Verifast VoC — Voice of Customer Analytics for E-commerce Brands  
**Version:** 1.0  
**Design System:** Midnight Clarity  
**Tech Stack:** React 19, shadcn/ui, Tailwind CSS 4, Recharts, Wouter  
**Data Scale:** 57,243 sessions · 1,877 chats · 3,372 orders

---

## Executive Summary

Verifast VoC is a nine-page analytics dashboard built for e-commerce brand managers who need to understand not just *what* their customers do, but *why* they do it. The design philosophy — **"Midnight Clarity"** — draws from the aesthetic language of PostHog, Linear, and Vercel: deep zinc surfaces, a single electric blue accent, and typographic hierarchy that makes data legible at a glance. The result is a tool that feels authoritative and precise without being cold or overwhelming.

The dashboard's standout feature, **Non-Buyer Intelligence**, surfaces purchase blockers extracted from 1,877 real chat transcripts using AI — giving brand managers a direct line to the unspoken objections that kill conversions. This feature receives special visual treatment (a rose-tinted gradient header, expandable blocker cards with sample quotes, and AI-generated action suggestions) to signal its strategic importance.

---

## 1. Design Philosophy: Midnight Clarity

The "Midnight Clarity" design system is a post-brutalist data minimalism aesthetic. It is defined by four core principles:

**Layered Elevation Without Pure Black.** The background is `oklch(0.098 0.008 285)` — a near-black with a barely perceptible blue undertone. Cards sit on `oklch(0.145 0.008 285)`, and nested elements on `oklch(0.21 0.008 285)`. This three-layer elevation system creates depth without harsh contrast.

**Data as the Hero.** Every pixel earns its place by communicating information. Decorative elements are eliminated; visual interest comes from the data itself — the shape of a trend line, the color of a severity badge, the size of a persona bubble.

**Monochromatic Base with a Single Accent.** The entire interface is zinc-toned except for the primary blue (`#3b82f6`), which marks every interactive element. This restraint makes the accent feel meaningful rather than decorative.

**Semantic Color Coding.** A five-color chart palette maps consistently across all pages: blue for primary metrics, emerald for revenue and growth, violet for AI features, amber for warnings and deal-hunters, rose for danger signals and non-buyer data.

### Reference Inspirations

| Platform | Borrowed Element |
| :--- | :--- |
| **PostHog** | Dense data tables, inline sparklines, expandable row details |
| **Linear** | Sidebar navigation with icon+label pairs, active state indicator line |
| **Vercel** | Zinc color palette, monospace metric display, minimal chrome |
| **Amplitude** | Multi-series area charts, funnel visualization patterns |
| **Mixpanel** | Dark mode chart tooltips, filter bar positioning |

---

## 2. Design Tokens

### 2.1 Color System

All colors are defined in OKLCH format for perceptual uniformity and Tailwind 4 compatibility. The system is dark-mode-first, with the same values applied to both `:root` and `.dark` selectors.

| Token | OKLCH Value | Hex Equivalent | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.098 0.008 285)` | `#09090b` | Page background |
| `--card` | `oklch(0.145 0.008 285)` | `#18181b` | Card surface (L1) |
| `--secondary` | `oklch(0.21 0.008 285)` | `#27272a` | Nested surface (L2) |
| `--border` | `oklch(1 0 0 / 10%)` | White 10% | Dividers, outlines |
| `--primary` | `oklch(0.623 0.214 259.815)` | `#3b82f6` | Interactive, links |
| `--foreground` | `oklch(0.97 0.003 285)` | `#fafafa` | Primary text |
| `--muted-foreground` | `oklch(0.65 0.01 285)` | `#a1a1aa` | Secondary text |
| `--positive` | `oklch(0.696 0.17 162.48)` | `#10b981` | Growth, success |
| `--warning` | `oklch(0.769 0.188 70.08)` | `#f59e0b` | Caution, medium |
| `--danger` | `oklch(0.637 0.237 25.331)` | `#f43f5e` | Error, high severity |
| `--violet` | `oklch(0.627 0.265 303.9)` | `#8b5cf6` | AI features, personas |

### 2.2 Chart Color Palette

The five-color semantic chart palette is applied consistently across all visualizations so that users develop an intuitive understanding of what each color represents.

| Chart Token | Color | Semantic Meaning |
| :--- | :--- | :--- |
| `--chart-1` | Blue `#3b82f6` | Primary metric (sessions, main data) |
| `--chart-2` | Emerald `#10b981` | Revenue, positive outcomes |
| `--chart-3` | Violet `#8b5cf6` | AI-generated, persona data |
| `--chart-4` | Amber `#f59e0b` | Warnings, deal-hunter persona |
| `--chart-5` | Rose `#f43f5e` | Non-buyer data, danger signals |

### 2.3 Typography

The dashboard uses **Geist** for all text and **Geist Mono** for all numeric metrics. This pairing creates a clear visual distinction between labels (Geist, proportional) and data values (Geist Mono, tabular), which is critical for scannability in dense data environments.

| Element | Font | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| Page Title | Geist | 20px | 600 | 28px |
| Section Title | Geist | 14px | 600 | 20px |
| Card Label | Geist | 11px | 500 | 16px (uppercase, tracked) |
| KPI Value | Geist Mono | 24px | 600 | 32px |
| Body Text | Geist | 13px | 400 | 20px |
| Table Cell | Geist | 12px | 400 | 16px |
| Metric Cell | Geist Mono | 12px | 400 | 16px |
| Micro Label | Geist | 10px | 400 | 14px |

### 2.4 Spacing Scale

The spacing system uses a base-4 scale, with key values at 4px, 8px, 12px, 16px, 24px, and 32px. Page-level padding is 24px (`p-6`). Card internal padding is 20px (`p-5`). Gap between cards is 12px (`gap-3`).

### 2.5 Border Radius

A single radius value of `0.5rem` (8px) is used throughout, applied via `--radius: 0.5rem`. This creates a consistent, slightly rounded aesthetic that feels modern without being overly soft.

---

## 3. Layout Architecture

### 3.1 Shell Structure

The application shell consists of three fixed elements:

**Sidebar (240px / 60px collapsed).** The sidebar contains the Verifast logo, navigation items with icon+label pairs, and a user/store profile section at the bottom. It collapses to icon-only mode via a toggle button on its right edge. The transition is 200ms ease-out for a snappy, responsive feel. On mobile (<768px), the sidebar becomes a slide-in drawer triggered by a hamburger menu in the header.

**Header (56px).** The header contains a live data indicator (pulsing green dot), a global date range selector, a notification bell with unread badge, and a store selector dropdown. The date range selection affects all charts on all pages simultaneously. The header uses `backdrop-blur-sm` for a subtle frosted glass effect when content scrolls beneath it.

**Content Area.** The main content area is `flex-1 overflow-y-auto` and receives a `page-enter` animation class on each route change (250ms fade + 8px upward translate).

### 3.2 Grid System

The content area uses a 12-column CSS Grid for maximum layout flexibility:

| Layout Pattern | Usage |
| :--- | :--- |
| 6 × 2-column cards | KPI strip on Overview, UTM summary |
| 8-column + 4-column | Chart + alerts panel (Overview) |
| 12-column full-width | Data tables, funnel visualization |
| 6-column + 6-column | Side-by-side charts (Competitors, Nudges) |
| 8-column + 4-column | Persona detail + radar chart |

---

## 4. Page-by-Page Specifications

### Page 1: Overview Dashboard

The Overview is the entry point and must communicate the health of the entire business in a single view. It is organized into three vertical zones.

**Zone 1 — KPI Strip.** Six cards arranged in a single horizontal row, each displaying one metric with a monospace value, a delta badge (positive/negative/neutral), and a contextual icon. Cards animate in with a 60ms stagger delay, creating a cascade effect that draws the eye from left to right. The metrics are: Sessions (57.2K), Chat Interactions (1.9K), Orders (3.4K), Conversion Rate (5.89%), Average Order Value ($127.40), and Chat Conversion Rate (18.20%).

**Zone 2 — Charts + Alerts.** A 2/3 + 1/3 split. The left panel contains a multi-series area chart showing daily trends for sessions, orders, and chats over the 30-day period. The right panel contains a Quick Alerts list — four actionable alerts color-coded by severity (amber for warnings, emerald for positive signals, blue for informational). Each alert includes a timestamp and a plain-English description.

**Zone 3 — Revenue Trend.** A full-width area chart showing daily revenue with an emerald gradient fill. The Y-axis is formatted as `$XK` for readability.

### Page 2: Conversion Funnel

The funnel page visualizes the five-stage customer journey: Visited → Product Viewed → Engaged → Chatted with Bot → Ordered.

**Horizontal Funnel Bars.** Each stage is represented as a horizontal bar whose width is proportional to its count relative to the total sessions. The bars use a gradient from a stage-specific color (blue → indigo → violet → light violet → emerald for the final "Ordered" stage). Drop-off percentages appear as severity-coded badges to the right of each bar: red for drops >30%, amber for >15%, neutral for <15%.

**Insight Callout.** A blue-tinted callout box below the funnel summarizes the key finding: the largest drop-off (45.8%) occurs between Product Viewed and Engaged, and customers who do engage convert at 18.2% — 3.1× the baseline. This callout is the most important piece of information on the page and is given prominent visual treatment.

**Device Breakdown Chart.** A grouped bar chart showing desktop vs. mobile counts at each funnel stage, allowing brand managers to identify device-specific friction points.

### Page 3: UTM Attribution

The UTM Attribution page answers the question: "Which channels are driving the most revenue, and which convert best?"

**Revenue by Source Chart.** A horizontal bar chart (layout="vertical" in Recharts) with each bar color-coded by source (Google = blue, Facebook = indigo, Organic = emerald, Instagram = rose, Email = amber, TikTok = violet, Direct = zinc). This layout is chosen over a vertical bar chart because the source names are long and read more naturally in a horizontal format.

**Sortable Performance Table.** A full-width table with seven columns: Source/Medium, Sessions, Chats, Orders, Conv. Rate, Chat Conv. Rate, Revenue. All numeric columns are sortable by clicking the header. Conversion rate cells use semantic color badges (green for ≥7%, neutral for ≥5.5%, amber for <5.5%) to enable instant performance assessment without reading numbers.

### Page 4: Non-Buyer Intelligence (The Killer Feature)

This page receives the most distinctive visual treatment in the entire dashboard, signaling its strategic importance.

**Gradient Header.** A full-width panel with a rose/amber gradient background (`linear-gradient(135deg, zinc-900 0%, rose-tinted-zinc 60%, zinc-900 100%)`) and a radial glow in the top-right corner. A "KILLER FEATURE" badge in rose, a stats strip (1,877 chats analyzed, 1,632 non-buyer conversations, 6 blockers found, $47K recoverable revenue), and a description establish the context immediately.

**Expandable Blocker Cards.** Six purchase blockers are displayed as accordion cards, ranked by mention frequency. Each card shows: a rank number, the blocker name, a severity badge (High/Medium), a progress bar showing relative frequency, a mention count, a percentage of non-buyers, and a trend indicator (up/down/stable with percentage change). The most critical blocker — "Price / Value Concern" (412 mentions, +22% trend) — is ranked first.

When expanded, each card reveals two panels: **Sample Quotes** (four real customer quotes from chat transcripts, displayed in italic) and **AI-Suggested Action** (a specific, actionable recommendation in an amber-tinted callout box, plus a "Create Nudge from This" button that links to the Nudge Effectiveness page workflow).

**Objection Trend Chart.** A multi-series line chart showing weekly mention counts for each blocker over six weeks. The rising subscription concern line (violet) and the consistently high price concern line (rose) are immediately visible.

### Page 5: Competitor Mentions

**Share of Conversation Donut Chart.** A donut chart with percentage labels rendered inside each segment. AG1 (Athletic Greens) dominates at 28.4%, followed by Huel (19.8%) and Ritual (17.0%). An inline legend to the right of the chart shows each competitor's color and share percentage.

**Mention Trend Line Chart.** A five-month line chart showing how competitor mentions have evolved. The NutriBlend line (amber) shows the steepest growth, visually confirming the "Fastest Growing" KPI card.

**Intelligence Table.** A table with five columns: Competitor, Mentions, Share (with inline progress bar), Sentiment (positive/neutral/negative badge), and Trend (icon + label). Sentiment is derived from conversation analysis — Ritual has the highest positive sentiment (0.45) while NutriBlend has the lowest (0.12), suggesting customers are skeptical of the newcomer.

### Page 6: Shopper Personas

**Bubble Selector.** Five persona bubbles are displayed in a horizontal row, sized proportionally by population share. The largest bubble (Deal Hunter, 28%) is visually dominant. Clicking a bubble selects it and scales it up with a 110% transform, while deselected bubbles dim to 70% opacity.

**Persona Detail Card.** The selected persona's card spans 2/3 of the content width and uses the persona's color as a tinted background. It contains: an emoji avatar, a name and population share, a description paragraph, four KPI stats (Sessions, Conv. Rate, AOV, LTV Score), a behavior tag cloud, and a two-cell strategy grid (Top Objection + Best Nudge).

**Behavioral Radar Chart.** A five-axis radar chart occupying the remaining 1/3 of the width, showing the selected persona's scores on: Price Sensitivity, Research Depth, Chat Engagement, Conversion Speed, and LTV Potential. The Ingredient Reader persona (default selection) shows high scores on Research Depth and LTV Potential, visually confirming its status as the highest-value segment.

### Page 7: Nudge Effectiveness

**Ranked Nudge List.** Seven nudge types are displayed as horizontal cards, sorted by conversion lift. Each card shows: a rank number, the nudge name, a lift bar (proportional to the maximum 9.7% lift), the lift percentage, and four stats (triggered, converted, revenue, AOV lift). The "Free Shipping Threshold" nudge ranks first with 9.7% lift and $39,740 in attributed revenue.

**Revenue by Nudge Chart.** A horizontal bar chart using the same color-per-nudge system as the ranked list, allowing easy cross-reference between the list and the chart.

**Conversion Lift Trend.** A multi-series line chart showing how each nudge's lift percentage has evolved over four weeks. All nudges show upward trends, confirming that the AI is improving its targeting over time.

### Page 8: Session Explorer

**Search and Filter Bar.** A search input (filters by session ID, source, and persona) combined with three filter tabs (All Sessions / Chatted / Ordered). The result count updates in real-time as filters are applied.

**Dense Session Table.** A nine-column table with: Session ID (with device icon), Date, Source, Persona (color-coded badge), Duration, Pages, Chat (icon if chatted), Order (icon if ordered), Revenue. The table uses `hover:bg-zinc-800/30` for row hover states and a selected state with a blue tint.

**Session Timeline Panel.** Clicking a row opens a 320px-wide timeline panel that slides in from the right (no full-page navigation). The panel shows: session metadata (source, persona, device, revenue), and a chronological event log with color-coded event types (blue for page views, violet for engagement events, amber for nudge triggers, emerald for chat events, rose for conversion events). Each event shows a timestamp, event type badge, and a plain-English description.

### Page 9: Ask Your Customers

The AI query interface is designed to feel like a conversation with a knowledgeable analyst who has read every chat transcript.

**Chat Interface.** A standard chat layout with AI messages on the left (blue-to-violet gradient avatar) and user messages on the right (blue-tinted bubble). The AI's welcome message establishes context: "I have access to 1,877 chat transcripts, 57,243 browsing sessions, and 3,372 orders."

**Data Context Pills.** Three pills below the header show the data sources the AI has access to, plus an "AI ready" indicator with a pulsing green dot. These pills serve as a constant reminder that answers are grounded in real data, not hallucinated.

**Typing Indicator.** Three animated dots (1.2s pulse loop with 200ms stagger) appear while the AI is "thinking," providing visual feedback during the simulated 1.8-second response delay.

**AI Response Format.** Responses include: a markdown-rendered answer with bold key terms, a "Data Sources Used" section listing the specific data points referenced, and a confidence score with a visual progress bar. This transparency builds trust in the AI's answers.

**Suggested Questions.** Three suggested question chips appear above the input area, allowing users to explore common queries without typing. These are designed to demonstrate the system's capabilities to new users.

---

## 5. Component Specifications

### 5.1 KpiCard

The KpiCard is the most reused component in the dashboard. It accepts `label`, `value`, `delta`, `prefix`, `suffix`, and `icon` props.

The value is formatted automatically: numbers ≥1,000,000 display as `XM`, numbers ≥1,000 display as `X.XK`, and decimals display with two decimal places. The delta badge uses three states: positive (emerald, TrendingUp icon), negative (rose, TrendingDown icon), and neutral (zinc, Minus icon). A subtle radial glow effect appears on hover, emanating from the top of the card in the primary blue color at 4% opacity.

### 5.2 DashboardLayout

The layout component manages sidebar state (collapsed/expanded), date range selection, and the global header. It uses `useLocation` from Wouter to determine the active navigation item and applies the active state indicator (a 2px blue line on the left edge of the nav item).

### 5.3 Badge System

Five badge variants are defined as CSS utility classes in `index.css`:

| Class | Background | Text | Border |
| :--- | :--- | :--- | :--- |
| `badge-positive` | `emerald-500/15` | `emerald-400` | `emerald-500/20` |
| `badge-warning` | `amber-500/15` | `amber-400` | `amber-500/20` |
| `badge-danger` | `rose-500/15` | `rose-400` | `rose-500/20` |
| `badge-neutral` | `zinc-700/50` | `zinc-300` | `zinc-600/30` |
| `badge-blue` | `blue-500/15` | `blue-400` | `blue-500/20` |

### 5.4 Chart Tooltip

All Recharts tooltips use a consistent dark surface style: `background: oklch(0.21 0.008 285)`, `border: 1px solid oklch(1 0 0 / 12%)`, `border-radius: 8px`, `font-size: 12px`. Numbers in tooltips use Geist Mono for tabular alignment.

---

## 6. Interaction Patterns & Micro-Animations

### 6.1 Hover States

All interactive elements use `transition-all duration-120` (120ms) for hover state changes. Card hover states apply a subtle border color shift from `border-border` to `border-zinc-600/50` and a radial glow effect. Table row hover states apply `bg-zinc-800/30`. Navigation item hover states apply `text-foreground` and `bg-accent`.

### 6.2 Page Transitions

Route changes trigger the `page-enter` animation: `opacity: 0 → 1` and `translateY: 8px → 0` over 250ms with ease-out easing. This creates a gentle entrance effect that signals a context change without being distracting.

### 6.3 KPI Card Stagger

The six KPI cards on the Overview page animate in with a 60ms delay between each card, creating a left-to-right cascade. This is implemented via inline `animationDelay` styles on each card.

### 6.4 Chart Animations

Recharts provides built-in animation for chart rendering. Area charts and line charts draw from left to right over approximately 400ms. Bar charts grow upward from the baseline. These animations are preserved at their default settings.

### 6.5 Sidebar Collapse

The sidebar width transitions from 240px to 60px (or vice versa) over 200ms with ease-out easing, defined by the `sidebar-transition` CSS class. The collapse toggle button is positioned on the right edge of the sidebar using `absolute -right-3 top-1/2 -translate-y-1/2`.

### 6.6 Live Data Indicator

A 1.5px green dot in the header pulses continuously using the `pulse-dot` animation (2s ease-in-out infinite, scaling between 1 and 0.8 at 50% opacity). This communicates that the data is live without requiring text explanation.

---

## 7. Mobile Responsive Design

### 7.1 Breakpoint Strategy

| Breakpoint | Sidebar | Grid | KPI Cards |
| :--- | :--- | :--- | :--- |
| <768px (Mobile) | Slide-in drawer | 1 column | 2×3 |
| 768–1024px (Tablet) | Icon-only (60px) | 2 columns | 3×2 |
| >1024px (Desktop) | Full (240px) | 12 columns | 6×1 |

### 7.2 Content Adaptations

Data tables become horizontally scrollable on mobile with a sticky first column for context. Charts reduce in height from 240px to 160px on mobile. The Session Explorer timeline panel becomes a full-screen overlay on mobile rather than a side panel. Persona bubbles resize proportionally and wrap to two rows on mobile.

### 7.3 Touch Targets

All interactive elements maintain a minimum 44×44px touch target, achieved through padding rather than size increases where necessary. Table rows have increased vertical padding on mobile (`py-3` vs `py-2.5` on desktop).

---

## 8. Information Hierarchy & Data Density

The dashboard follows a **progressive disclosure** model: the most important information is always visible, with secondary details available on demand through expansion, hover, or click.

**Above the Fold.** Each page places its most critical KPI or visualization in the first 400px of vertical space. On the Overview page, this is the KPI strip. On the Non-Buyer Intelligence page, this is the gradient header with the recoverable revenue estimate.

**Data Density Calibration.** The dashboard targets a "medium-high" density level — comparable to PostHog or Amplitude rather than a simplified consumer dashboard. This is appropriate for the target user (brand managers and growth analysts) who are comfortable with data-rich interfaces. Tables use 12px font size and 10px padding to maximize information per screen.

**Semantic Color Reduction.** By limiting the color palette to five semantic colors and applying them consistently, the dashboard avoids the cognitive load of interpreting arbitrary colors. Users quickly learn that rose = non-buyer/danger, emerald = revenue/growth, amber = warning/deal-hunter.

**Whitespace as Breathing Room.** Despite the high data density, 24px page padding and 12px card gaps prevent the interface from feeling cramped. Section headers with uppercase tracking and muted color provide visual anchors that help users orient themselves within each page.

---

## 9. Implementation Notes

### 9.1 Recharts Configuration

All charts use `ResponsiveContainer` with `width="100%"` and a fixed `height` in pixels. The `CartesianGrid` uses `strokeDasharray="3 3"` and `stroke="oklch(1 0 0 / 0.05)"` for subtle grid lines. All axes use `axisLine={false}` and `tickLine={false}` for a clean, minimal appearance. Active dots on line/area charts use `r=4` with a dark stroke matching the card background.

### 9.2 Performance Considerations

Mock data is defined in a single `mockData.ts` file and imported directly into page components. In production, this would be replaced with React Query hooks fetching from a backend API. The `page-enter` animation uses CSS `@keyframes` rather than JavaScript for optimal performance. Chart re-renders are minimized by keeping chart data as stable references (not computed inline in render).

### 9.3 Accessibility

All interactive elements have visible focus rings (configured via `outline-ring/50` in the global CSS). Color is never the sole means of conveying information — severity badges include both color and an icon. The sidebar collapse button has a clear affordance (chevron icon). Chart tooltips are keyboard-accessible via Recharts' built-in tab navigation.

---

*Specification prepared by Manus AI · Verifast VoC Analytics Dashboard v1.0*
