---
name: artizen-design-system
description: Artizen's palette, type roles, button and badge rules as artizen.fyi applies them. Use when writing or changing CSS, page templates or client-rendered markup, choosing a colour or a button style, adding a badge or pill, or reviewing UI for palette and contrast.
paths:
  - "src/styles.css"
  - "src/html/**"
  - "src/client/**"
---

# Artizen design system

The site wears Artizen's clothes so it reads as a companion, not a clone. Colours and type come from the [Artizen style guide](https://play.artizen.fund/style-guide/); the rules below are how artizen.fyi applies them. The tokens, and the notes behind them, live at the top of `src/styles.css`.

## Palette

Brand and Interface colours only on chrome. Illustration colours (Reef #B3F487, Gravel #4D5D53, Coral #FFB887, Truffle #B7A593, Lavender #C2B6DC) are for drawings.

| Name | Hex | Token | Use |
| --- | --- | --- | --- |
| Night | #101212 | `--ink` | text, Primary hover and active |
| Slate | #202222 | `--slate` | Primary button, pressed filter |
| Barracuda | #8690A0 | `--muted` | secondary text, Limited badge text |
| Moon | #F1F3EE | `--paper` | page ground, washes, neutral badge fill |
| White | #FFFFFF | `--panel` | panels and cards |
| Stone | #D9DBE0 | `--line` | borders, neutral outlines, Limited fill |
| Algae | #1ACC6C | `--green` | Bootstrap primary and the focus ring; never under type |
| Moss | #06AA59 | `--green-deep` | every green fill that carries type, the fit meter, links |
| UI Warning | #D6C52D | `--warn` | warnings without red |
| UI Alert | #D62D6A | `--alert` | curation-history badges (Applied, Curated, Funded) with white type |
| Wash | #FAFAFA | | style-guide surface; unused so far |

Contrast facts that decide the rules: Algae on white is 2.1:1 and cannot carry white type. Moss carries white at 6.9:1. Moss as text on white is 3.0:1, which is what the brand gives links. UI Alert carries white at about 4.8:1 and is the other filled Interface colour.

## Rules

- **One green per card.** Strong and Good (badge and meter) fill with Moss. Worth a look is a Moss wash on Moon. Limited is a dashed Stone outline. Two greens on one card is a bug.
- **Fit owns green; history has its own colour.** Curation-history badges (Applied, Curated, Funded) use `artizen-known-relationship`: a UI Alert fill with white type, so history never borrows fit's green. Applied uses a send mark rather than a check, because a tick reads as acceptance.
- **Buttons follow the guide's roles.** Primary is Slate darkening to Night; Secondary is a Slate outline that fills with Moon. Both pill-shaped at weight 500. Bootstrap's `btn-dark` and `btn-outline-dark` are retargeted once in `styles.css`; never restyle a button at its call site.
- **A pressed filter is Primary, not Algae.** Slate with white type puts the label at 16:1 instead of 2.1:1.
- **Stone outlines on Moon** for neutral states: Available money, Not curating, Inactive.
- **Type roles.** Headings, UI, buttons and navigation in Roc Grotesk (`--bs-heading-font-family`); lead copy and subtitles in P22 Mackinac (`--bs-subtitle-font-family`); body on this site is Roc Grotesk Medium. Fallbacks are Helvetica and Georgia. Do not load new fonts.
- **Shape.** `--radius: 1.15rem` on panels and cards, `--shell: 90rem` for the page width, one shadow token.
- **Motion.** Cards arrive only on a fresh result set (`--card-index`), settle in place when a set is narrowed, and `prefers-reduced-motion` turns the animation off. A new animation follows the same three rules.
- **Where CSS goes.** Matching styles sit between `/* ARTIZEN_MATCHING_CSS_START */` and `END` in `src/styles.css`, and `splitPageStyles` serves them only on `/match`. Board styles go outside the markers. New page-specific CSS follows the same split.
- **Markup.** Pages are template strings in `src/html/`; every interpolated value goes through `escapeHtml`. Bootstrap utilities are fine for layout; the Artizen look comes from the tokens, not from overriding Bootstrap per element.

## Before you finish

- Every new colour resolves to a token above, or has an ADR.
- White type sits only on Moss, UI Alert, Slate or Night.
- A card shows one green.
- Buttons use `btn-dark` or `btn-outline-dark` with no call-site overrides.
- Reduced motion is respected.
