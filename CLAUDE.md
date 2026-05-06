# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build (output: dist/)
npm run lint     # ESLint check
npm run preview  # preview production build locally
```

No test suite is configured.

## Architecture

Single-page React app (Vite + Recharts). No backend — all data persisted in `localStorage` under the key `expense-tracker-data` as `{ expenses, categories }`.

### Data flow

`useExpenses` (`src/hooks/useExpenses.js`) is the single source of truth. It owns `expenses[]` and `categories[]`, persists both to localStorage on every change, and exposes `addExpense / deleteExpense / addCategory / deleteCategory`. `App.jsx` consumes this hook and passes slices down to child components.

Expense object shape: `{ id: string, amount: number, category: string, date: "YYYY-MM-DD", note: string }`.

### Shared constants

`src/constants/categories.js` exports `CATEGORY_COLORS`, `CATEGORY_ICONS`, `getCategoryColor(cat)`, `getCategoryIcon(cat)`. All components import from here — do not redefine color/icon mappings locally.

`src/constants/quotes.js` exports `FRUGALITY_QUOTES` array (12 items), cycled by index in `SuccessModal`.

### Theming (dark mode)

CSS custom properties are defined in `src/index.css` under `:root` and overridden in `@media (prefers-color-scheme: dark)`. Variables: `--bg`, `--surface`, `--text`, `--text-2`, `--text-3`, `--border`, `--border-2`, `--input-bg`, `--input-focus`, `--shadow-*`, `--divider`, `--cat-tag-bg`. All component CSS files use these variables — never hardcode light/dark colors in components.

### Key non-obvious behaviours

- **Success flow**: `App.jsx` wraps `addExpense` in `handleAdd`, which also calls `playSound()` (Web Audio API synth, no audio file) and sets `successExpense` state to trigger `SuccessModal`. The modal auto-dismisses after 4 s via `setTimeout` stored in `closeTimerRef`.
- **Chart drill-down**: `Charts.jsx` holds local `drillMonth` state. Monthly view = bar chart of all 12 months in current year; clicking a bar sets `drillMonth` to `"YYYY-MM"` which switches to daily bar chart and filters the pie chart to that month.
- **Date wheel picker**: `DateWheelPicker.jsx` uses CSS `scroll-snap-type: y mandatory` with `ITEM_H = 44px` padding cells to center first/last items. `scrollTop = index * ITEM_H`. A `userScrollingRef` flag prevents programmatic `scrollTop` writes from conflicting with active user scroll.
- **Icon sizing**: `ExpenseList.jsx` maps amount to one of 5 icon sizes (18–40 px) via `getAmountLevel()` thresholds at 100 / 300 / 500 / 1000.
