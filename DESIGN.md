---
version: alpha
name: CasaDue
description: Shared-expense PWA for two people (Marco & Sara), with a fixed cool-toned palette and a balance-scale metaphor.
colors:
  primary: "#43719C"
  primary-light: "#C4D6E8"
  accent: "#6F6BA0"
  accent-light: "#D3CFE6"
  background: "#F4F6FA"
  card: "#FFFFFF"
  text: "#17212F"
  text-soft: "#5A6A7C"
  border: "#D2DEEC"
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

CasaDue is an Italian, mobile-first PWA where two named people (Marco and Sara) log and split household expenses and read who owes whom. The interface is a single column capped at phone width, driven by a fixed bottom navigation, and built as static HTML/CSS with vanilla JS against Supabase. Two decisions define its identity and every screen inherits them: a single cool-toned palette delivered as CSS custom properties, and the home screen leading with a literal balance scale that tilts toward whoever is owed money.

## Colors

The palette exists only as CSS custom properties (`--c-*`) set on `:root`; every surface reads through them, so new UI must reference the tokens and must not hardcode hex. The one sanctioned exception is categorical data (the stats donut and its legend), which uses a fixed twelve-color array in JS, kept independent of the theme so category identity stays stable.

`primary` is the single brand and interaction color: active nav, selected toggles, focus rings, links, and monetary emphasis. `accent` appears almost exclusively paired with `primary` in gradients (header, progress fills, highlight cards), not as a standalone action color. `error` marks destructive and invalid states; `success` marks confirmation. `nav-surface` is tracked separately from `card` so a future dark surface can diverge the two without touching card styling.

## Typography

Nunito is the only UI typeface, and weight — not size or family — carries hierarchy: 900 for screen and app titles, 800 for buttons, labels, and toggles, 700 for body-strong and list text, 600 for secondary and input text. Because the interface never drops below 600, treat 700 as the effective base weight and reserve 400 for cases that read as genuinely muted.

Playfair Display (700) is reserved exclusively for monetary amounts — the balance credits, expense amounts, and the receipt total — where the serif is the app's numeric signature. Do not use it for headings, labels, or any non-monetary text; a money value rendered in Nunito or a heading rendered in Playfair both break the established contract.

Field labels are set uppercase with positive letter-spacing to separate them from the sentence-case values beneath them.

Monetary and numeric figures use tabular (fixed-width) numerals so that stacked amounts, split fields, and chart values keep their digits vertically aligned; apply this to every element that renders a currency or count, not only the Playfair amounts.

## Layout

Content is a single column with `max-width: 480px` centered; at viewports ≥480px the whole app (`#main-app`) is framed as a phone-width card with a surrounding shadow, and the fixed bottom nav is constrained and centered to match. Navigation is a fixed bottom bar, so page content reserves space for it with bottom padding equal to the nav height plus `env(safe-area-inset-bottom)`, and the nav itself pads its bottom by the same inset. The header is a full-bleed gradient band with a rounded bottom edge that anchors the brand color at the top of every session.

## Elevation & Depth

Depth is soft and consistent: resting cards combine a hairline border (~1.5px in the border token) with a low shadow (`0 2px 10px rgba(0,0,0,0.06)`), never a border alone. Raised elements go stronger — the header, primary buttons, and the floating add-button carry heavier shadows to sit above the card layer. Modal, receipt, and postcard overlays dim the background with a translucent black scrim and slide or scale in from that layer.

## Shapes

Rounded geometry is the core of the visual language and radius encodes role: cards use the largest rounded-rectangle radius, inputs and primary buttons a slightly smaller one, and fully rounded pills are reserved for the settle button and status chips. Avatars and the add-button are full circles. Keep this ladder intact — a square-cornered card or a pill-shaped input would read as foreign.

## Components

Buttons come in three shared roles: `btn-primary` is a solid primary-filled, shadowed, full-width action; `btn-secondary` is a bordered card-colored button for secondary choices; `btn-icon` is a translucent-white square used only on the gradient header. Selection controls — the payer toggle and the category grid — share one pattern: an unselected item is a bordered card-colored tile in the muted text color, and selecting it switches the border and fill to primary (solid for the payer toggle, primary-light tint for category tiles). List rows (expense and recurring cards) share the card treatment: a leading rounded icon tile filled with the background token, a flexible middle column that truncates long text (with the payer carried inline in its muted meta line), and a right-aligned value column reserved for the amount alone in the Playfair amount style, so the figure is the single emphasis on that side. Text inputs, the month navigator, and the close/settle buttons all take the same focus treatment — the border turns primary and a primary-light ring appears — so focus reads identically across the app. The split control resolves its own ambiguity: below the per-person share rows it shows a live, primary-tinted outcome line stating who owes whom in plain language, recomputed from payer, amount, and split, so the numeric split never has to be mentally translated into a direction.
