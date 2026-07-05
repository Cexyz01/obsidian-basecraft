# Basecraft — launch posts

Tre post, tre posti, tre toni. Ordine consigliato: forum → Reddit → Discord
(il forum dà un link citabile nei commenti Reddit se qualcuno chiede dettagli).

Momento consigliato: lunedì tra le 15:00 e le 17:00 italiane (mattina USA east coast).

⚠️ PRIMA DI POSTARE: sostituisci ogni blocco `[TUO ANEDDOTO: …]` con una o due
frasi tue vere. Tutto il resto è pronto così com'è.

Immagini (in `marketing/png/`):
- `pivot-count.png` — la pivot base, per il post Reddit
- `pivot-heatmap.png` — heatmap medie rating, seconda immagine ovunque serva
- `pivot-drilldown.png` — drill-down aperto, per il forum

---

## 1 · r/ObsidianMD

**Titolo:**

```
Bases can't cross-tabulate, so I built a Pivot view for it
```

**Corpo** (allega `pivot-count.png` come immagine del post, `pivot-heatmap.png` nei commenti se chiedono del Pro):

```
[TUO ANEDDOTO: 1-2 frasi vere su cosa stavi tracciando nelle note quando ti sei
accorto che Bases non poteva incrociare due proprietà. Esempio di taglio: "I keep
my reading log in Obsidian and I wanted to see books per author per year -
turns out Bases can filter and list, but it can't count across two properties."]

So I wrote Basecraft. It adds a Pivot view type to any .base file: pick a row
property, a column property, an aggregation, and you get a spreadsheet-style
cross-table built from your notes. Works on whatever properties your notes
already have - status × project, category × month, topic × rating.

The screenshot is my reading log: authors as rows, years as columns, count in
the cells. Row, column and grand totals included.

Free version does count and sum pivots with totals - no account, nothing
leaves your vault, works on mobile too. There's a paid tier ($14 one-time, not
a subscription) with average/median/min/max, click-a-cell drill-down to the
matching notes, heatmap, and CSV/Excel export. Being upfront about that so
nobody feels ambushed.

It's in the community store: Settings → Community plugins → search "Basecraft".

V0.4, so there will be rough edges - if you hit one, tell me here or on GitHub
and I'll fix it. Multi-level rows/columns are next on the list.
```

**Dopo il post:** rispondi ai commenti nelle prime 2-3 ore (è metà del valore).
Se qualcuno contesta il prezzo: "the free tier is permanent, not a trial - Pro
just funds the maintenance" e basta, niente difese lunghe.

---

## 2 · forum.obsidian.md → Share & Showcase

**Titolo:**

```
Basecraft — pivot tables for Bases (count, sum, drill-down, heatmap, Excel export)
```

**Corpo** (allega tutte e tre le immagini nell'ordine count → heatmap → drilldown):

```
Basecraft adds a Pivot view type to Obsidian Bases.

Bases is great at listing and filtering notes, but it can't answer questions
like "how many notes per status per project" or "average rating per author per
year". A pivot table is the right tool for that, so I built one.

**How it works**

1. Open any .base file (or create one)
2. Add a view, pick "Pivot"
3. Choose a row property, a column property, and an aggregation

The table recomputes as your vault changes. Everything runs locally - the
plugin makes no network calls during normal use.

**Free**
- Count and Sum aggregations
- Row, column and grand totals

**Pro ($14 one-time, 3 devices, never expires)**
- Average, Min, Max, Median, Distinct count
- Drill-down: click any cell to list and open the notes behind it
- Heatmap conditional formatting
- Values as % of total / row / column
- CSV and Excel (.xlsx) export

**Install:** Settings → Community plugins → Browse → "Basecraft"
**Source:** https://github.com/Cexyz01/obsidian-basecraft
**More:** https://hewnpath.com/basecraft

Known limits in V0.4: one property per axis (multi-level rows/columns are
planned), and the Excel export is values-only, no formulas.

[TUO ANEDDOTO: una frase su come lo usi tu oggi, tipo "I use it daily for my
reading log and expense notes." — dev'essere vera.]

Happy to answer anything, and bug reports are welcome on GitHub.
```

---

## 3 · Discord Obsidian → canale #updates (o #plugin-showcase)

```
Basecraft is now in the community store — it adds a Pivot view to Bases.
Row property × column property × aggregation = a cross-table of your notes
(reading log by author × year, tasks by status × project, and so on).
Count/sum pivots are free, everything stays in your vault.
Store: search "Basecraft" · details: https://hewnpath.com/basecraft
```

(Discord non ama i wall of text: queste 5 righe bastano. Allega `pivot-heatmap.png`.)

---

## Regole d'ingaggio comuni

- Mai postare gli stessi identici paragrafi in due posti (i mod di r/ObsidianMD
  controllano il crossposting pigro).
- Non linkare Polar/checkout direttamente nei post: il percorso è store → plugin
  → Settings, o hewnpath.com/basecraft. Il post vende il tool, non la cassa.
- Se un post va bene su Reddit (>50 upvote), NON boostarlo altrove lo stesso
  giorno: lascia respirare, il forum può aspettare 48h.
- Ratings: se qualcuno scrive che gli è utile, chiedigli (una volta sola, in
  risposta) se gli va di lasciare una recensione sulla pagina del plugin.
