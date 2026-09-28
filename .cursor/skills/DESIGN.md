# Databuck Design System

Databuck is a data-quality / reconciliation platform (matching, verifying, and monitoring records across enterprise systems — Salesforce, SAP, NetSuite, Workday, Snowflake, etc). This design system, "Modern Workspace," was built from a written specification only — no Figma file, codebase, or existing UI screenshots were provided or attached to this project. All visual foundations below are authored directly from that spec; all components and the UI kit are original builds in that style (a from-scratch run, per design-system authoring rules), not a recreation of an existing Databuck product.

**Sources:** none attached (no Figma link, no GitHub repo, no local codebase). This build was rewritten against a set of pasted visual reference images (color palette sheets, type scale, spacing/radius, component inventory, table/modal/toast/loading specimens) supplied directly in chat — those images are the current source of truth for colors, type, and component styling below, superseding the original text-only spec's numeric values where they conflict.

## Philosophy

Modern Workspace favors approachable, minimal, polished enterprise UI over rigid industrial data-tool aesthetics: generous whitespace, soft surface contrast, consumer-grade patterns (pill badges, subtle borders, layered cards) applied to high-density data workflows. Deep slate ink + indigo/cyan accents carry emphasis without visual noise.

## Content fundamentals

No product copy sample was provided, so tone is inferred from the spec's own language and applied consistently in the UI kit:
- **Direct and operational.** Labels name the object and its state plainly: "Data Sources", "Match Rate", "Sync Failed", "Open Exceptions" — no cutesy copy, no first-person voice ("I"/"we"), no exclamation points.
- **Status-first.** Every row or card leads with a concrete state (Verified, Pending Review, Sync Failed) rather than a narrative sentence.
- **No emoji.** Status is carried by color + a short uppercase word, never an emoji or icon substituting for text.
- **Sentence case for body copy, uppercase tracked labels for metadata** (badges, table headers, chip tags) — this contrast is a core rhythm of the type system, not decoration.
- Empty/error states get one calm sentence of explanation ("Import a file to get started."), not an apology or a joke.

## Visual foundations

- **Color:** Ink-black (`#000000`) text/primary on a warm-white surface base (`#F8F9FA`), with a saturated indigo accent (`#4B41E1`) as the sole brand color for primary actions and links. Deep crimson (`#BA1A1A`) marks danger/destructive states. A cyan accent (`#4CD7F6`) marks "stable/active" status dots, kept distinct from the green (`#22C55E`) used for success badges/toasts. Semantic tints (success/warning/danger/info) always pair a soft ~10%-alpha tint with a saturated base — never a solid block for passive status. Nested modules step through a tonal surface ladder (`surface` → `container` → `container_high` → `container_highest`) rather than pure white-on-white.
- **Type:** A dual-engine system. Inter carries every display size, heading, and paragraph — including a very heavy 800-weight, tightly-tracked (-0.04em) display size for hero numerals/wordmarks. JetBrains Mono renders anything literally data: IDs, latencies, timestamps, table numeric columns. Space Grotesk is reserved for uppercase, letter-spaced UI chrome — badges, table headers, tabs, breadcrumbs, nav labels — never body prose.
- **Spacing:** Strict 8pt grid — 4/8/16/32/64 primary steps (finer 12/20/24/40/48 steps fill gaps where needed).
- **Corner radius:** Sharp and technical, not soft: 2px (checkboxes, micro controls) → 4px (buttons, badges, inputs) → 8px (cards) → full pill (switches, avatars). Noticeably tighter than a typical consumer-soft system — this is an instrumentation tool, not a marketing surface.
- **Elevation:** Flat 1px borders plus a barely-there ambient shadow at rest; shadow strengthens only on hover and in modals. No colored shadows, no glow.
- **Backgrounds:** Flat color only — no gradients, imagery, or texture. Pure black is used deliberately as a surface (feedback toasts, processing overlays, the highest-emphasis "dark" button variant), not just as text ink.
- **Animation:** Hover/border/background transitions at 150ms `cubic-bezier(0.4,0,0.2,1)`. Toasts/banners slide in from the right at 300ms ease-out, exit with a fade + slide-down at 200ms ease-in. Modals scale 96%→100% with fade over 200ms. No bounce or overshoot.
- **Hover/press states:** Buttons darken one step on hover (indigo → `#3F35CC`, black → `#1A1A1A`, danger → `#9E1616`); no opacity-fade hovers.
- **Transparency/blur:** Reserved for modal backdrops (`rgba(15,23,42,.5)` + 4px blur) and the black "processing" overlay — never decorative elsewhere.
- **Borders:** `#E2E8F0` default, `#CBD5E1` for emphasis/hover — never pure black borders.

## Iconography

No icon set, icon font, or SVG sprite was provided in any source. Stroke-style outline icons (gear/settings, search, checkmark, alert) appear throughout the reference material at consistent sizes (16/20/24/32px) but no concrete asset was attached — this build uses plain inline stroke-SVG placeholders at the same sizes and does not fabricate a hand-rolled icon system. **If Databuck uses a specific icon library (Lucide, Heroicons, a proprietary set, etc.), please provide it or a source to pull from** — it should replace these placeholders before real use. No emoji are used anywhere.

## Logo

No logo file was provided. The brand name "Databuck" is rendered in plain type (Inter Bold) everywhere a mark would normally go, including the project thumbnail. Do not treat any wordmark rendering in this project as an official logo — supply the real logo asset to replace it.

## Fonts

Inter, Space Grotesk, and JetBrains Mono are loaded from Google Fonts via `@import` in `tokens/fonts.css` (no local font files were available to embed). If you need fully offline/self-hosted fonts, download the static files and swap the `@import` for local `@font-face` rules.

## Index

- `styles.css` — root stylesheet, imports everything below. Link this one file from any consuming project.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css` (spacing + radius), `elevation.css` (shadows + motion), `fonts.css` (webfont import).
- `guidelines/` — foundation specimen cards (colors, type scale, spacing, radius, elevation) shown in the Design System tab.
- `components/core/` — `Button`, `Badge`, `Card`
- `components/forms/` — `Input`, `Checkbox`, `Switch`
- `components/data/` — `DataTable`
- `components/feedback/` — `Toast`, `Banner`, `Modal`, `EmptyState`, `Skeleton`
- `components/navigation/` — `Tabs`, `Breadcrumbs`, `Pagination`
- `ui_kits/workspace/` — a data-source reconciliation dashboard (sidebar nav, top bar, metric cards, data table, toast), composed entirely from the components above. Marked as a starting point.
- `thumbnail.html` — homepage tile for this design system.
- `SKILL.md` — Claude Code / Agent Skills-compatible entry point.

## Intentional additions

Since no source defined a component inventory, the full set above was authored from scratch, sized to a data-quality product's needs (status-heavy tables, source-connection cards, sync feedback). `EmptyState`, `Skeleton`, `Banner`, `Modal`, `Tabs`, `Breadcrumbs`, and `Pagination` were added beyond the original spec's named components because reference material for this build described or depicted them in enough detail to implement directly (destructive confirmation modal, solid sync-result banners, tabbed table views, breadcrumb nav, table pagination).

## Caveats — please help iterate

1. **No real product context was attached.** This entire system is inferred from the written spec alone. If you have a live product, screenshots, a codebase, or a Figma file, attach it and I will rebuild the UI kit and component styling against the real thing.
2. **No logo or icon set provided** — both are placeholders (see above). Please share the real assets.
3. **Fonts are loaded from Google Fonts CDN**, not self-hosted — say if you need offline font files instead.
4. The single UI kit screen (data-source workspace) is a plausible reconciliation dashboard for a data-quality product, not a recreation of anything real — flag anything that doesn't match your actual product so I can correct it.
