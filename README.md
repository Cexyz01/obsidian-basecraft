# Basecraft

Pivot tables for [Obsidian Bases](https://help.obsidian.md/bases).

## What it does

Bases can list and filter your notes; it can't cross-tabulate them. Basecraft adds a Pivot view to any `.base` file: pick a row property, a column property, an aggregation, and you get a spreadsheet-style cross-table built from your own notes.

Say your reading notes have `author` and `year` properties. Rows = author, columns = year, aggregation = count: now you can see you read eleven books in 2024 and nine of them were by two authors. Same trick works for expenses by category × month, workouts by type × week, papers by topic × status.

## Free

- Pivot view (rows × columns)
- `Count` and `Sum` aggregations
- Row, column and grand totals

## Pro — $14 one-time

- `Average`, `Min`, `Max`, `Median` and `Distinct count` aggregations
- Drill-down: click a cell to see and open the matching notes
- Heatmap conditional formatting
- Show values as `% of total`, `% of row`, or `% of column`
- Export the pivot to CSV or Excel
- Future Pro additions ship as free updates

A license activates on up to 3 devices and never expires. Get a key at [hewnpath.com](https://hewnpath.com).

## Install

### From the community store

Coming soon — Basecraft is on its way to the Obsidian community plugins list.

### Manually (for now)

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Cexyz01/obsidian-basecraft/releases).
2. Place them inside `<your-vault>/.obsidian/plugins/basecraft/`.
3. In Obsidian, enable Community plugins and toggle Basecraft on.
4. Make sure the **Bases** core plugin is enabled.

## Use

1. Create or open a `.base` file.
2. Add a new view, choose **Pivot**.
3. In the toolbar, set Rows, Columns and an Aggregation.

That's it. The toolbar shows what's locked behind Pro and what's free.

## Status

V0.4 — license activation is live (Polar), drill-down, heatmap, percentages and CSV/Excel export all work. Multi-dimensional rows/columns and PNG export are next.

## Built by Hewnpath

One-person studio. Basecraft is the Obsidian sibling of HewnFrame (Figma) and HewnFlow (Webflow) — small tools that do one job and put a number on it. More at [hewnpath.com](https://hewnpath.com).
