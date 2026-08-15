---
version: alpha
name: CasaDue
description: Shared-expense PWA for two people (Marco & Sara), with a date-driven seasonal theme and a balance-scale metaphor.
colors:
  primary: "#D23F6C"
  primary-light: "#F6D2DE"
  accent: "#2A9D8F"
  accent-light: "#C3E5DE"
  background: "#FBF7F9"
  card: "#FFFFFF"
  text: "#2C2733"
  text-soft: "#6E6675"
  border: "#EBDCE3"
  nav-surface: "#FFFFFF"
  error: "#E05050"
  success: "#4CAF50"
typography:
  sans:
    fontFamily: Nunito
    fontSize: 16px
  amount:
    fontFamily: Playfair Display
    fontWeight: 700
---

## Overview

CasaDue is an Italian, mobile-first PWA where two named people (Marco and Sara) log and split household expenses and read who owes whom. The interface is a single column capped at phone width, driven by a fixed bottom navigation, and built as static HTML/CSS with vanilla JS against Supabase. Two decisions define its identity and every screen inherits them: the entire palette is delivered as date-driven theme tokens (season by default, holiday windows overriding), and the home screen leads with a literal balance scale that tilts toward whoever is owed money.

## Colors

The palette exists only as CSS custom properties (`--c-*`) set on `body`; every surface reads through them, so new UI must reference the tokens and must not hardcode hex. The one sanctioned exception is categorical data (the stats donut and its legend), which uses a fixed twelve-color array in JS that is intentionally theme-independent so category identity stays stable across seasons.

The active theme is selected automatically — the current season by default, replaced inside holiday windows — by toggling a class on `body`; a component styled against the tokens picks up every theme for free, which is why token discipline is load-bearing rather than cosmetic.

`primary` is the single brand and interaction color: active nav, selected toggles, focus rings, links, and monetary emphasis. `accent` appears almost exclusively paired with `primary` in gradients (header, progress fills, highlight cards), not as a standalone action color. `error` marks destructive and invalid states; `success` marks confirmation. `nav-surface` is tracked separately from `card` even though they share white in the default theme, because dark holiday themes diverge the two.

## Themes

The frontmatter holds the default theme (Primavera / spring). The values below are the alternate themes applied by a `body` class. They are documentation only — the token names in the frontmatter remain the single source of truth. Seasons switch by month; holiday themes override the season inside date windows. `card` and `nav-surface` are `#FFFFFF` in every theme except where listed.

| Theme (`body` class) | primary | primary-light | accent | accent-light | background | text | text-soft | border | card / nav override |
|---|---|---|---|---|---|---|---|---|---|
| `summer` | #F4844B | #FFD4BA | #4BADE0 | #C0E4F8 | #FFFDF0 | #2C3E50 | #7A8C9A | #FFE4C4 | — |
| `autumn` | #C0623A | #F0C4A8 | #8B6B4A | #E0D0BC | #FDF6EC | #2D1B0E | #8C6A44 | #F0D8C0 | — |
| `winter` | #5B8FBF | #BACFE8 | #9B84BE | #DDD4F0 | #F5F7FA | #1A2332 | #6A7A8C | #D8E4F0 | — |
| `no-season` | #D23F6C | #F6D2DE | #2A9D8F | #C3E5DE | #FBF7F9 | #2C2733 | #6E6675 | #EBDCE3 | — |
| `holiday-natale` | #C0392B | #FADBD8 | #1E8449 | #A9DFBF | #FFF8F0 | #1A1A1A | #7D6608 | #F5CBA7 | — |
| `holiday-capodanno` | #9B59B6 | #E8DAEF | #D4AC0D | #FCF3CF | #0D0D1A | #EAEAEA | #B0A0D0 | #2A2A4A | card/nav #1A1A2E |
| `holiday-epifania` | #1A5276 | #AED6F1 | #D4AC0D | #FCF3CF | #EBF5FB | #1A2332 | #5D6D7E | #AED6F1 | — |
| `holiday-sanvalentino` | #C0392B | #FADADD | #E91E8C | #FBCFE8 | #FFF0F3 | #2C0A0A | #A04060 | #F5B8C4 | — |
| `holiday-pasqua` | #7D3C98 | #E8DAEF | #28B463 | #A9DFBF | #FDFEFE | #1C1C2E | #6C4A8A | #D7BDE2 | — |
| `holiday-ferragosto` | #1565C0 | #BBDEFB | #F9A825 | #FFF9C4 | #E3F2FD | #0D1B2A | #455A64 | #90CAF9 | — |
| `holiday-halloween` | #E65100 | #FFE0B2 | #6A1B9A | #E1BEE7 | #1A0A00 | #FFD180 | #CE93D8 | #4A2000 | card/nav #2C1400 |

## Typography

Nunito is the only UI typeface, and weight — not size or family — carries hierarchy: 900 for screen and app titles, 800 for buttons, labels, and toggles, 700 for body-strong and list text, 600 for secondary and input text. Because the interface never drops below 600, treat 700 as the effective base weight and reserve 400 for cases that read as genuinely muted.

Playfair Display (700) is reserved exclusively for monetary amounts — the balance credits, expense amounts, and the receipt total — where the serif is the app's numeric signature. Do not use it for headings, labels, or any non-monetary text; a money value rendered in Nunito or a heading rendered in Playfair both break the established contract.

Field labels are set uppercase with positive letter-spacing to separate them from the sentence-case values beneath them.

Monetary and numeric figures use tabular (fixed-width) numerals so that stacked amounts, split fields, and chart values keep their digits vertically aligned; apply this to every element that renders a currency or count, not only the Playfair amounts.

## Layout

Content is a single column with `max-width: 480px` centered; at viewports ≥480px the whole app (`#main-app`) is framed as a phone-width card with a surrounding shadow, and the fixed bottom nav is constrained and centered to match. Navigation is a fixed bottom bar, so page content reserves space for it with bottom padding equal to the nav height plus `env(safe-area-inset-bottom)`, and the nav itself pads its bottom by the same inset. The header is a full-bleed gradient band with a rounded bottom edge that anchors the seasonal color at the top of every session.

## Elevation & Depth

Depth is soft and consistent: resting cards combine a hairline border (~1.5px in the border token) with a low shadow (`0 2px 10px rgba(0,0,0,0.06)`), never a border alone. Raised elements go stronger — the header, primary buttons, and the floating add-button carry heavier shadows to sit above the card layer. Modal, receipt, and postcard overlays dim the background with a translucent black scrim and slide or scale in from that layer.

## Shapes

Rounded geometry is the core of the visual language and radius encodes role: cards use the largest rounded-rectangle radius, inputs and primary buttons a slightly smaller one, and fully rounded pills are reserved for the settle button, holiday banner, and status chips. Avatars and the add-button are full circles. Keep this ladder intact — a square-cornered card or a pill-shaped input would read as foreign.

## Components

Buttons come in three shared roles: `btn-primary` is a solid primary-filled, shadowed, full-width action; `btn-secondary` is a bordered card-colored button for secondary choices; `btn-icon` is a translucent-white square used only on the gradient header. Selection controls — the payer toggle and the category grid — share one pattern: an unselected item is a bordered card-colored tile in the muted text color, and selecting it switches the border and fill to primary (solid for the payer toggle, primary-light tint for category tiles). List rows (expense and recurring cards) share the card treatment: a leading rounded icon tile filled with the background token, a flexible middle column that truncates long text (with the payer carried inline in its muted meta line), and a right-aligned value column reserved for the amount alone in the Playfair amount style, so the figure is the single emphasis on that side. Text inputs, the month navigator, and the close/settle buttons all take the same focus treatment — the border turns primary and a primary-light ring appears — so focus reads identically across the app.
