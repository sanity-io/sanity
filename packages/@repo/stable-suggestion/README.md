# @repo/stable-suggestion

Internal tool that suggests which already-published `sanity` version to move to the npm `stable` dist-tag. `.github/workflows/suggest-stable.yml` runs it after every release to `latest`. The workflow posts a shortlist of up to three versions to Slack with a link to the `tag-stable.yml` workflow page. A person promotes a version by running that workflow and typing the version. Nothing is promoted by the suggestion itself, and `tag-stable.yml` posts the result to Slack.

## Promoting

The Slack message and the run summary both say: open the `tag-stable.yml` workflow page, click Run workflow and enter the version. `gh workflow run tag-stable.yml -f version=<X.Y.Z>` does the same from a terminal. `tag-stable.yml` validates the version, reads the current stable tag, tags every package, updates the bundle manifest and posts the outcome to Slack.

The webhook payload has four variables because Workflow Builder inserts them literally and applies no markup: `headline` is the first line and is bolded in the step, `text` is the body, `cli` is the `gh workflow run tag-stable.yml -f version=<pick>` command and is styled as code in the step (`-` when there is no pick), and `run_url` drives the button. Each reason in `text` is a single sentence the prompt caps at 120 characters, and a longer one is cut at a word boundary before 140 characters.

## Rules

Terms: **A** is the as-of instant. **S** is the current stable at A. **L** is the latest version at A. **published(v)** is the npm publish time of v.

The universe is every non-prerelease `sanity` version published at or before A that is newer than S. A version is eligible when no hard reason applies.

Hard reasons:

- `too-new`: the version has been on npm for less than 7 days. A version on a newer major than S needs only 3 days. An urgent version on S's own major needs only 1 day (see Urgent mode).
- `superseded`: a newer patch of the same minor exists. Only the highest patch of each minor is ever a candidate, and that patch soaks its own days.
- `deprecated`: npm marks the version deprecated. Live mode only, because past deprecation timing is unknown.
- `regression`: Radar holds a confirmed regression introduced at or before the version and not fixed by a published version at or before it. Any severity blocks. A regression counts from the `_updatedAt` of its Radar document.
- `missing-packages`: some package that the repo publishes lacks the version on npm. Live mode uses the list `tag-stable.yml` iterates. As-of mode infers the list from the packages that have L.
- `rolled-back`: a successful `tag-latest.yml` run moved latest back to X at time T, and the version is above X on the same major and was published before T. It applies from T onward, so a version published after T is unaffected, and a later move back up to the version lifts it. In live mode any version above the current npm `latest` is also rolled back whatever the history says. In as-of mode only moves at or before A count. A same-version re-point changes nothing.
- `regression-data-unavailable`: Radar could not be read, so every version is held. The tool fails closed.

The `@stable` history that defines S is the successful `tag-stable.yml` runs.

Eligible versions are ranked newest first, except that patches of stable's own minor come first (highest first). The shortlist is the top three, and the deterministic pick is the first one, or hold when none is eligible.

Soft flags never block. They appear in Slack and in the prompt:

- `is-patch`: the version is a patch release.
- `major-upgrade`: the version is on a newer major than S. This marks a major transition and is not a risk signal. Slack adds a banner line when any shortlisted version is on a newer major.
- `sqrl-drop`: the SQRL score is below 90 percent of the median of up to four earlier releases with the same formula version. It needs at least two baseline points.
- `sqrl-regressed-inputs`: one or more SQRL inputs trended as a regression.
- `sqrl-reliability`: SQRL recorded reliability events.
- `sqrl-missing`: no SQRL score exists for the version at A.
- `open-issue-reports`: an open, non-feature GitHub issue mentions the version.
- `open-investigation`: a Radar bisect session spans the version and was open at A. A session created before A and confirmed or closed after A still counts as open at A.
- `adoption-below-stable`: live mode only, the version has a smaller share of last-week downloads than S.

When issues or downloads are unavailable, the Slack text says so.

## Urgent mode

A version gets the 1 day soak instead of 7 (or 3) when it is a patch on stable's own major.minor, for example 6.15.1 when S is 6.15.0, or when stable is hit by a confirmed regression and the version is at or above the `fixedIn` of every regression hitting S. Every other hard rule still applies. The smallest jump off a broken stable is the safest, so urgent versions lead the shortlist, oldest first, with patches of stable's minor ahead of other fixes. Urgent applies only to versions on stable's own major, so a new major keeps its 3 day soak. When stable is at risk or such a patch exists, the Slack message carries an Urgent banner that names the reason and the recommended version. The one day soak is only claimed when the recommended version is itself urgent.

The tool only runs after a release. A patch of stable's minor is itself a release, so the patch case fires on its own. The case where a later release fixes a broken stable fires on the next release after that fix has soaked a day.

## Split stable

In live mode the tool reads the `stable` dist-tag of every package the repo publishes. When the packages disagree, the Slack message carries a warning that lists them. A split does not block promotion, because a fresh promotion re-tags every package. As-of mode cannot know the tag history, so the check does not apply there.

## Claude step

Claude receives the evidence and the deterministic shortlist and returns a shortlist of one to three versions taken only from the eligible set, plus promote or hold. Any failure falls back to the deterministic shortlist and records the reason. The step is skipped with `--no-llm`, without `ANTHROPIC_API_KEY`, or when no version is eligible. Moving stable to a new major is expected once it has soaked, so the prompt tells Claude not to hold on that alone.

## CLI

Run from the repo root. The script runs inside the package directory, so every path option takes an absolute path.

```bash
pnpm stable-suggestion --help
pnpm stable-suggestion collect [--as-of <ISO>] --out <evidence.json>
pnpm stable-suggestion recommend <evidence.json> --out-dir <dir> --run-url <url> --workflow-url <url> [--no-llm]
pnpm stable-suggestion slack-route
pnpm stable-suggestion backtest [--from <date>] [--to <ISO>] --out <report.md> [--json <file>] [--llm-sample <d1,d2>] [--max-llm-calls 4]
```

Exit codes: 0 on success, 1 on a failure, 2 on invalid usage. `collect --as-of` must parse, must not be in the future and must be on or after 2025-01-01. The Slack route written to `GITHUB_OUTPUT` is checked against a fixed set of values first.

Environment: `RADAR_SANITY_READ_TOKEN`, `GITHUB_TOKEN` or `GH_TOKEN` (falls back to `gh auth token`), `ANTHROPIC_API_KEY` and `STABLE_SUGGESTION_MODEL`. `HAS_SUGGESTION_WEBHOOK` and `HAS_CI_ALERTS_WEBHOOK` drive `slack-route`.

## Local recipe

```bash
export RADAR_SANITY_READ_TOKEN=...   # from `pnpm exec sanity debug --secrets`, never print or commit it
export GITHUB_TOKEN=$(gh auth token)
mkdir -p "$PWD/.context/out"
pnpm stable-suggestion collect --out "$PWD/.context/out/evidence.json"
pnpm stable-suggestion recommend "$PWD/.context/out/evidence.json" --out-dir "$PWD/.context/out" --run-url https://example.invalid/run --workflow-url https://example.invalid/workflow --no-llm
```

`recommend` writes `recommendation.json`, `slack-webhook.json` (`{headline, text, cli, run_url}`, where `run_url` is the `tag-stable.yml` workflow page), `slack-fallback.json` (`{text}`, the headline in bold, the text and the command in backticks) and `summary.md`. Nothing posts to Slack from the CLI.

`--history <file>` on `collect` and `backtest` reads a recorded history JSON instead of fetching, which runs the tool offline. `src/__fixtures__/history.json` is such a file.

## Backtest

`backtest` fetches the history once. For every Tuesday at 18:00 UTC from 2025-12-09 to the last Tuesday before now, it rebuilds the evidence as it was at that instant, runs the rules and records the shortlist. Claude runs only on `--llm-sample` dates, capped by `--max-llm-calls`, and only when `ANTHROPIC_API_KEY` is set.

An independent checker, which does not import the rules, scores the run:

- P1: every shortlisted version passes the hard rules re-derived from the same evidence.
- P2: the evidence for every date equals the evidence built from a history truncated at that date, so nothing after the date leaks in.
- P3: 6.11.0 is never shortlisted on or after 2026-09-01T15:24Z.
- P4: shortlisted versions inside the known-bad range 6.9.2 to 6.14.0 are classed as knowable or unknowable at the time.
- P5: agreement with the versions humans promoted within seven days of each date.

Limitations:

- Deprecation timing is unknown for past dates, so the deprecated rule is not applied.
- No per-version downloads exist for past dates, so the adoption flag is not evaluated.
- Radar history starts in mid 2026 and SQRL scores for 6.4 to 6.20 were backfilled on 2026-10-21, so earlier dates show `sqrl-missing`.
- The Tuesday grid can miss a promotion that happens between two Tuesdays.
