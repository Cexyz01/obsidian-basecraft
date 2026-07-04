# Launch checklist — actions that need your accounts

Code, release, and catalog branch are done. Three account-gated steps remain.

## 1. Open the catalog PR (30 seconds)

The branch `add-basecraft` with the `community-plugins.json` entry is already
pushed to the fork. The API refuses PR creation on the obsidianmd org from
CLI tokens, so open it from the browser while logged in as Cexyz01:

1. Go to <https://github.com/obsidianmd/obsidian-releases/compare/master...Cexyz01:obsidian-releases:add-basecraft>
2. Create pull request → title `Add plugin: Basecraft`
3. Fill the plugin template checkboxes (all apply: release 0.4.0 has
   `main.js` + `manifest.json` + `styles.css`, tag matches manifest, tested
   on Windows, LICENSE present).
4. Note the freemium disclosure: free tier fully works; Pro is an optional
   one-time key, disclosed in README and UI.

Review queue is measured in weeks — submit before anything else.

## 2. Polar product (~5 min)

- Dashboard → Products → New Product
- **Name:** Basecraft Pro
- **Pricing:** One-time purchase, USD $14
- **Benefits → License Keys:** activation limit `3`, expires unset
- No webhook and no worker needed: the plugin validates keys directly
  against Polar's public customer-portal endpoints with the org id baked in
  (`src/license/client.ts`).
- After creating, copy the checkout URL and put it on hewnpath.com — the
  plugin's "Get Basecraft Pro" links point at <https://hewnpath.com>.

## 3. Smoke test (5 min)

- Buy (or issue via Polar sandbox) one key.
- In Obsidian → Basecraft settings → paste key → Activate. Expect "Basecraft
  Pro activated" and Pro aggregations unlocked.
- Deactivate → expect the free tier back and the activation slot freed.

## Done in the repo

- Polar-backed license client (activate / validate / deactivate, 3-day
  re-validation, 30-day offline grace)
- GitHub release `0.4.0` with the three artifacts
- Catalog branch `add-basecraft` on the fork
- ESLint (obsidianmd plugin) clean; build + tsc green
- Sales sheet / manual PDFs rebuilt without Lemon Squeezy references
