---
name: verify-studio
description: Prove a Studio change works by hand in a real browser — start the test studio (port 3333) or the e2e studio (port 3339) in tmux, give an e2e run its own cursor_ci_ dataset, sign in without leaking the token, drive the browser with playwright-cli through the walkthrough recipes in features/, save screenshots as evidence, and clean up only what the run started. Use when a change needs manual verification, when asked to log in to the dev studio, or when flaky e2e or staging rate limits keep CI from proving a change. Not a replacement for the e2e suite.
---

# Verify a Studio change by hand

A scripted way to show that a change works in a running studio: start it, sign in, walk through
a recipe, capture screenshots and report each step. Use it when the e2e suite cannot give an
answer (a flaky spec, staging 429s across a stack of PRs, a state no spec covers) or when a PR
needs visual evidence. It does not replace e2e: when the behavior can be asserted in a spec, add
the spec too, and say in the report which steps were checked by hand.

Adapted from `verify-huey` in sanity-io/huey.

## Targets

| Target | Command                                 | URL                              | Project, API                  | Token secret            | Dataset                                 |
| ------ | --------------------------------------- | -------------------------------- | ----------------------------- | ----------------------- | --------------------------------------- |
| `test` | `pnpm dev:test-studio` (+ preview 3334) | `http://localhost:3333/test`     | `ppsg7ml5`, `api.sanity.io`   | `STUDIO_AUTH_TOKEN`     | `test` (shared: clean up what you seed) |
| `e2e`  | `pnpm --filter studio-e2e-testing dev`  | `http://localhost:3339/chromium` | `ittbm412`, `api.sanity.work` | `STUDIO_E2E_AUTH_TOKEN` | a fresh `cursor_ci_<hex>` per run       |

Prefer `e2e` for anything that writes: the run gets an empty dataset of its own, which
`cleanup.sh` deletes. Use `test` for the test studio's schema and plugins, and for Presentation
against the local preview iframe (`http://localhost:3334`; the e2e studio previews the deployed
`https://test-studio-preview-iframe.sanity.dev`). `VERIFY_STUDIO_TOKEN_VAR` names a different
token variable, `VERIFY_STUDIO_DATASET` reuses an existing e2e dataset (cleanup then leaves it).

A token only works against its own API host. Sent to the other one it gets 401 "Session not
found", which the studio shows as a login screen. `check-auth.sh` (run by `start-studio.sh`)
asks `/users/me` on both hosts and says which mismatch it is.

## Prerequisites

- Packages built: `sanity dev` loads `sanity.cli.ts` without the `monorepo` condition and needs
  `packages/sanity/lib/cli.js`. See the Node version and turbo notes in `AGENTS.md`.
- `tmux`, `curl`, `openssl`, `node`, and Chrome for playwright-cli (`/opt/google/chrome` in the
  Cursor Cloud VM; `VERIFY_STUDIO_BROWSER` picks another, e.g. `chromium` after
  `pnpm dlx @playwright/cli@0.1.22 install-browser`).
- Do not run `pnpm check:oxlint` while a studio is up (memory, see `AGENTS.md`). Commit and push
  before starting.

## Run

```bash
S=.agents/skills/verify-studio/scripts
$S/start-studio.sh e2e            # tmux session verify-studio-e2e, waits until the studio answers
$S/login.sh e2e /chromium/content # signs the browser in; prints only origin + path
$S/wait-for.sh '[data-testid="action-publish"]'
$S/pw.sh click '[data-testid="action-publish"]'
$S/pw.sh screenshot --filename=/tmp/verify-studio/captures/01-published.png
$S/cleanup.sh                     # always, also after a failed run
```

- **`pw.sh`** is playwright-cli in the skill's session (`-s=verify-studio`), run from the state
  directory so `.playwright-cli/` never lands in the repository. Targets are CSS selectors
  (Playwright's `:has-text()` works); `pw.sh --raw eval "<expr>"` reads state. Read the
  `playwright-cli` skill for the full command list.
- **`wait-for.sh <css> [text]`** before every click or fill on something Studio renders
  asynchronously: playwright-cli fails at once when the target is not there yet.
- **Screenshots:** pass absolute paths. Before a screenshot, move the pointer off the controls
  (`pw.sh mousemove 5 890`) so a tooltip does not cover the state. In Cursor Cloud save them under
  `/opt/cursor/artifacts/` so they reach the user.
- **State** lives in `/tmp/verify-studio` (`VERIFY_STUDIO_STATE_DIR`): `state.env`, one log per
  service (`e2e.log`, `test.log`, `gateway.log`) and the playwright-cli output. `start-studio.sh`
  refuses to run while a `state.env` exists; run `cleanup.sh` first.

## Signing in

`login.sh` runs `auth-gateway.sh`, a local page on `127.0.0.1:3390` that reads the token from a
mode-600 file in the state directory and redirects to `<studio>#token=<token>`. Studio consumes
the hash and removes it from the address bar, so the token never appears in a command line, a
prompt, a log or the browser history the agent reads back. `login.sh` then waits for the navbar
and fails if `token=` is still in the URL.

Token rules:

- Never print, `echo` or interpolate a token into a command, URL, prompt or file outside the state
  directory. Scripts pass it through environment variables and `curl -H @-`.
- Never screenshot a page before `login.sh` has reported `signed in`.
- Never commit anything from `/tmp/verify-studio` or `.playwright-cli/`.

## Cleanup

`cleanup.sh` closes the browser session, stops the process trees of the tmux sessions it
recorded (TERM, then KILL after 10 seconds), deletes the e2e dataset if this run created it, and
removes the token file and `state.env`. It leaves other tmux sessions and listeners alone, and
warns when something else still holds one of its ports. Logs stay for the report. If a dataset
delete fails, cleanup exits non-zero and keeps the state so it can be re-run; `pnpm e2e:cleanup`
sweeps `cursor_ci_*` datasets older than 24 hours as a backstop only.

## Recipes and reporting

`features/` holds walkthroughs in a fixed format; `features/README.md` defines it and how to
report a run. Pick the recipe for the area the change touches, adapt its steps to the change, and
report every step as `verified`, `failed` or `skipped` — a skipped step is never reported as
verified, and the summary names what was not checked.

| Recipe                              | Covers                                       |
| ----------------------------------- | -------------------------------------------- |
| `features/document-pane-editing.md` | create a document, edit fields, draft status |
| `features/publishing.md`            | publish and unpublish                        |
| `features/releases.md`              | create, archive and delete a release         |
| `features/presentation.md`          | preview iframe, overlays, viewport toggle    |

## Attaching the evidence to a PR

Hand the screenshots to the `before-and-after` skill (`.agents/skills/before-and-after`): its
formatter writes a before/after table into the PR body. Capture "before" on the base branch and
"after" on the change with the same viewport and steps. Where `gh` is read-only (Cursor Cloud),
reference the files from `/opt/cursor/artifacts/` in the PR body through the PR tool instead of
`gh pr edit --attach`.
