# Launch checklist, actions that need your accounts

Code, release, and catalog branch are done. Three account-gated steps remain.

## 1. Submit via the community portal, DONE 2026-07-04

Obsidian no longer accepts PRs to `obsidian-releases` (the repo has pull
requests disabled, verified 2026-07-04). Submission now goes through their
portal:

1. Go to <https://community.obsidian.md> and sign in with your Obsidian
   account (create one if needed).
2. Link the GitHub account **Cexyz01** to verify repo ownership.
3. **Plugins → New plugin** → repository URL
   `https://github.com/Cexyz01/obsidian-basecraft`
4. Agree to the developer policies → **Submit**.

Everything the portal checks is already in place: release `0.4.0` with
`main.js` + `manifest.json` + `styles.css`, README, LICENSE, manifest at
HEAD of `main`, id without "obsidian". If the automated review asks for
changes, fix in-repo and publish a bumped release.

The freemium angle is disclosed in README and UI: free tier fully works,
Pro is an optional one-time key.

Review queue is measured in weeks, submit before anything else. (The old
`add-basecraft` branch on the obsidian-releases fork is obsolete; delete
the fork whenever.)

## 2. Polar product (~5 min)

- Dashboard → Products → New Product
- **Name:** Basecraft Pro
- **Pricing:** One-time purchase, USD $14
- **Benefits → License Keys:** activation limit `3`, expires unset
- No webhook and no worker needed: the plugin validates keys directly
  against Polar's public customer-portal endpoints with the org id baked in
  (`src/license/client.ts`).
- After creating, copy the checkout URL and put it on hewnpath.com, the
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
