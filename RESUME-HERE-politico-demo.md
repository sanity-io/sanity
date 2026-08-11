# RESUME HERE — POLITICO Content Variants demo

Built for a POLITICO intro call (Publishing use case, Content Variants V1: personalization +
A/B testing). Same mechanism as the Brew & Bean coffee shop demo, applied to a news-article
content model. Full build: `dev/test-studio/schema/politico/`, `dev/preview-politico/`,
`dev/test-studio/scripts/seed-politico.ts`.

## Current state

**Working today (localhost only):** Studio workspace at `localhost:3343/politico`, storefront
at `localhost:3335`. Base article ("EU AI Act enforcement rules"), sponsor, and home page are
seeded and render correctly — headline/dek/kicker localize to en/fr/es, body/byline/section all
correct, zero console errors.

**Not working: variant switching.** The 6 `pol-*` variant definitions (3 personalization: US
reader/Spain reader/Pro subscriber, 3 A/B: headline B/C + sponsored insert) cannot be created
anywhere this account can write to. See the permission matrix below — this is the blocker to
clear before variant-switching can be demoed live.

## Root cause — two independent problems, not one

Diagnosed by testing plain document writes and variant-definition-create actions across every
project this account touches:

| Project                                                                              | Dataset       | Plain write                       | Variant defs                      | Diagnosis                                                                      |
| ------------------------------------------------------------------------------------ | ------------- | --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `ppsg7ml5` (Sanity Studio Test Data, 290 members — where the coffee shop demo lives) | `coffee-shop` | ❌ `permission "create" required` | ❌ `permission "update" required` | Variants **is** enabled here. Role too restrictive — an access problem.        |
| `ttfgug5v` (Studio Variants Demo — this account's own, full admin)                   | `production`  | ✅ works                          | ❌ `count exceeds the limit of 0` | Full access, but Variants closed beta **not entitled** on this project.        |
| `2fk8fyxp` (Personalisation, 36 members)                                             | `production`  | ❌                                | ❌ `limit of 0`                   | Same as ttfgug5v: not entitled, and this account's role here also can't write. |
| `bd1m5gb3` (Editorial Workflows Sandbox, 2 members)                                  | `sandbox`     | ❌                                | ❌ `limit of 0`                   | Same pattern.                                                                  |

`"Insufficient permissions"` = a role problem (who can write). `"count exceeds the limit of 0"` =
an entitlement problem (whether the feature exists on the project at all, independent of role).
Neither fix touches the other.

## Two fixes, either unblocks the rest

1. **Fast:** ask a `ppsg7ml5` Administrator (Cody Olsen or Kristofer Joseph) to bump this
   account's role to Editor/Administrator. Variants is already live there — this alone finishes
   the demo on the exact project the coffee shop demo already runs on.
2. **Durable:** get `ttfgug5v` added to the Content Variants closed-beta allowlist internally.
   Slower, but ends the recurring dependency on a shared project's role grants for future
   demos — full control on an account-owned project instead.

**As of this note:** sent Pedro a paste-ready diagnosis (repro steps + 4 trace IDs) covering
both tracks — access on `ppsg7ml5` and entitlement on `ttfgug5v`. Also surfaced a real identity
wrinkle worth remembering: the same email can have separate Sanity accounts per login provider
(SAML vs Google vs GitHub), each with its own project memberships — an "Administrator" grant
visible on one identity's Members page doesn't mean the identity your CLI/token is currently
using has any access at all. Re-ran the repro under both identities; still blocked on both as of
2026-08-11. This is now Pedro's to resolve — no further action needed here until he responds.

**Call outcome (2026-08-11):** the POLITICO intro call happened using the already-deployed
coffee shop demo (`https://test-studio-preview-iframe-git-cursor-coffee-shop-presen-764c1b.sanity.dev`)
instead of this build — sufficient for an intro conversation, since variant-switching wasn't
live here yet. This POLITICO build is parked in a known-good state (base content + 4 articles on
`ttfgug5v`/`production`, zero console errors, localization verified) ready to pick up variants
the moment either access fix lands.

## Once either lands

Run `cd dev/test-studio && npx tsx scripts/seed-politico.ts` — it's already idempotent
(`createIfNotExists` for base content, and `seedVariants()` now fails gracefully with a clear
message rather than crashing if variants still aren't available). If the fix landed on
`ppsg7ml5`/`coffee-shop` instead of `ttfgug5v`, repoint three places back:
`dev/test-studio/sanity.config.ts` (politico workspace `projectId`/`dataset`),
`dev/preview-politico/src/loader.tsx` (same), and `dev/preview-politico/.env`
(`SANITY_VIEWER_TOKEN` — swap for the coffee-shop-scoped token in `dev/preview-iframe/.env`).

## Not yet done

- Commit + push this branch (`cursor/coffee-shop-presentation-4399`) with the POLITICO build.
- Redeploy both Vercel projects once ready to demo beyond localhost — `preview-politico` isn't
  a Vercel project yet; needs to be created (same access caveat noted earlier this session: some
  Vercel projects live under a team not visible to the connected Vercel MCP).
- Once variants work: verify all 6 variant states live in a real browser, same as the coffee
  shop demo's verification pass.
