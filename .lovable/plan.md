## Plan: Liquid Glass Rebuild — All Features in One Shot

Single-file update to `public/app.html`. Keeps every existing add/delete/persistence/back-navigation feature intact. Layers in: edit, categories, drag-reorder (toggle mode), move-between-categories, search, favorites, JSON backup, watched/ratings/stats, glass redesign, splash.

---

### 1. Visual redesign — Apple Liquid Glass

- Background: animated purple → blue → pink gradient with soft blur orbs.
- All cards (folders, list items, category headers, dialogs, search): frosted glass via `backdrop-filter: blur(28px) saturate(180%)`, semi-transparent white tint, 1px inner highlight, 25–32px radii, soft layered shadows, subtle "shine" diagonal.
- Selected/highlighted item: violet→pink glow ring + inner light.
- Smooth `cubic-bezier(0.22, 1, 0.36, 1)` transitions for hover, tap, expand/collapse.
- Splash screen on first load: app logo (glass disc with gradient + glow), fade + scale-in, dissolves after 700ms.
- Typography: Poppins (already a Google Font; loaded via `<link>` in app.html since this is the standalone HTML file).
- App logo: generated premium glass disc with purple/pink gradient + film-strip glyph.

### 2. Data model (localStorage v3 — migrates from v2)

```text
col_categories_v3 = { movie: [{id, name, order, collapsed}], web: [...], animeSeries: [...], animeMovie: [...] }
col_items_v3      = { movie: [{id, name, categoryId, order, watched, rating, favorite}], ... }
col_settings_v3   = { sortOrder, theme, ... }
```

Seed migration on first v3 load: builds categories from current built-in headlines (MCU, Deadpool & Wolverine, Venom, Batman, Joker, Conjuring, Final Destination, Anaconda, Bruce Lee, Jackie Chan, Other Movies). Reads `col_added_v2` and `col_deleted_v2` so user history is preserved.

### 3. New built-in items added (from your screenshots → "Other Movies" category)

Movies: Project Hail Mary, Shutter Island, Inception, Interstellar, The Cabin in the Woods, Fight Club (1999), Micheal (2026), Obsession.

Web Series: If wishes could kill, Moon knight (Marvel), Loki (Marvel), All of us are dead, Alice in borderland.

Anime Series: My Dress-Up Darling, Alya Sometimes Hides Her Feelings in Russian, Classroom of the Elite.

### 4. Categories

- Each list page shows categories as collapsible glass cards: `📁 Marvel (45) ▾`.
- Tap header to expand/collapse; chevron rotates.
- Per-category Add button inside the header.
- New `+` flow shows two glass buttons: **Add to Existing** (category picker sheet) or **Create New Category** (name input → creates category → adds item inside).

### 5. Long-press action menu (replaces direct delete dialog)

Long-press any item → glass bottom sheet with 4 actions:

```text
✏️ Edit          → name input dialog, prefilled
📂 Move to       → category picker sheet
⭐ Favorite       → toggles favorite (also a star icon on each item)
🗑️ Delete        → existing confirm dialog
```

### 6. Reorder mode (Apple-style toggle)

- "Reorder" button next to Select. Tapping enters edit mode:
  - Items and category headers show a drag handle (≡) on the right.
  - HTML5 drag-and-drop with touch shim for mobile (pointer events on the handle only — no long-press conflict).
  - Drop indicator line shows insertion point.
  - Both items within a category and whole categories can be dragged.
- "Done" exits reorder mode and persists `order` fields.

### 7. Search

- Global search bar at top of each list page (replaces current single-list search).
- Live-filters items by name and category name across the current page.
- Highlights matches.

### 8. Favorites

- Star icon visible on every item; tap to toggle.
- Auto-generated "⭐ Favorites" virtual category pinned at the top of each list page when non-empty.

### 9. Watched + Ratings + Stats

- Each item has a small watched checkmark (toggled from action menu or by tapping the star area).
- Long-press menu adds inline 5-star rating row.
- Home stat card adds 3 numbers: % watched, average rating, current streak (count of items added this week).

### 10. Backup / Restore

- Settings sheet from home (gear icon top-right): **Export JSON** downloads a single file with categories + items + settings; **Import JSON** replaces local state after confirm dialog. Order, categories, watched, ratings, favorites all preserved.

### 11. Navigation — preserved & strengthened

- Keeps existing `NAV` stack + `popstate` guard so phone back goes page-by-page.
- Action sheets / dialogs also push a history state so back closes the sheet before navigating.

---

## Technical approach

Edit only `public/app.html`. Single self-contained file. Vanilla JS + CSS, no framework. Implementation order inside the file:

1. Replace `<style>` with new Liquid Glass design tokens (CSS variables for tints, blur, glow, radii, springs).
2. Add splash screen markup + dismiss script.
3. Rewrite home page: glass folders, settings gear, stats with new metrics, search input.
4. Rewrite each list page: search bar, Select/Reorder controls, collapsible category cards, items with star + serial + drag handle (hidden until reorder mode).
5. Add long-press → bottom-sheet action menu; wire Edit / Move / Favorite / Delete.
6. Add category picker sheet (used by Add + Move).
7. Add reorder mode: pointerdown-on-handle drag, drop indicator, persist order.
8. Add Export/Import JSON in settings sheet.
9. Add v2→v3 migration on init that builds categories from existing built-in section heads and merges added/deleted from v2.
10. Add new built-in items into "Other" category seeds.
11. Verify back navigation, persistence, and reorder all survive a refresh.

### Files modified

- `public/app.html` — only file touched.