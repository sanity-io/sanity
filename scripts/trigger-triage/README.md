# Issue Triage Trigger

This script triggers the Miriad issue triage workflow for a GitHub issue URL.
It is used by the `sanity-io/sanity` GitHub workflow and can also be run from
the terminal while developing or testing.

The GitHub Action installs root dependencies and runs the same `pnpm issue-triage`
scripts as local development via `tsx`. Use Node 22.18 or newer locally.

Like other helpers under `scripts/`, this folder is not a workspace package.
There is no local `package.json`, build output, or install step.

## How It Works

### On new issues

Given a GitHub issue URL, the default CLI path:

1. Parses the owner, repo, and issue number.
2. Fetches the issue from the GitHub REST API.
3. Ignores noise, including bot authors, dependency dashboards, and issues with
   ignored labels (`automated`, `dependencies`, `duplicate`, `wontfix`).
4. Creates or reuses a Miriad channel named `{repo}-issue-{number}`.
5. Adds the configured Miriad agents to the channel.
6. Posts a kickoff message that mentions `@triager`.

The trigger does not post back to GitHub. It only starts the Miriad workflow.

### On closed issues

A separate archive entrypoint handles closed issues. It fetches the issue to
apply the same ignore filters as triage, derives the expected channel name from
the issue URL, finds that channel in Miriad, and archives it:

```bash
pnpm issue-triage:archive https://github.com/sanity-io/sanity/issues/725
```

## GitHub Workflow

The workflow that calls this script is:

```text
.github/workflows/issue-triage.yml
```

It runs when:

- A new issue is opened.
- The `needs-triage` label is added to an existing issue.
- An issue is closed, which archives the matching Miriad channel.
- A developer manually runs the workflow from the GitHub Actions UI and provides
  an `issue_url` input.

For issue events, the workflow passes `github.event.issue.html_url` to the CLI.
For manual runs, it passes the `issue_url` input instead.

```bash
pnpm issue-triage --verbose "$ISSUE_URL"
```

Closed issue events run the archive mode:

```bash
pnpm issue-triage:archive --verbose "$ISSUE_URL"
```

Archive mode calls the Miriad REST API equivalent of:

```bash
curl -X POST "$MIRIAD_URL/channels/$CHANNEL_ID/archive" \
  -H "Authorization: Bearer $MIRIAD_TOKEN"
```

To trigger it manually, open the `Issue Triage` workflow in GitHub Actions, click
`Run workflow`, and paste a GitHub issue URL such as
`https://github.com/sanity-io/sanity/issues/12835`.

## Local Usage

From the repository root:

```bash
pnpm issue-triage https://github.com/sanity-io/sanity/issues/12835
```

Dry-run mode fetches and filters the issue, then prints the Miriad kickoff
message without calling Miriad:

```bash
pnpm issue-triage --dry-run https://github.com/sanity-io/sanity/issues/12835
```

Verbose mode prints debug logs:

```bash
pnpm issue-triage --verbose https://github.com/sanity-io/sanity/issues/12835
```

Archive the Miriad channel for a closed issue:

```bash
pnpm issue-triage:archive https://github.com/sanity-io/sanity/issues/12835
```

## Required GitHub Actions Secrets

Add these to the repository's GitHub Actions secrets:

- `MIRIAD_URL` - Miriad REST API base URL.
- `MIRIAD_TOKEN` - Bearer token for the Miriad REST API.
- `MIRIAD_SPACE_ID` - Miriad space short id.

The workflow sets `GITHUB_TOKEN` from GitHub's built-in token:

```yaml
GITHUB_TOKEN: ${{ github.token }}
```

Do not add a custom `GITHUB_TOKEN` repository secret for this workflow.

## Local Environment

For local terminal runs, `GITHUB_TOKEN` is optional. Set it only if anonymous
GitHub API requests hit rate limits or if you are testing against a private
repository.

```bash
GITHUB_TOKEN=ghp_example pnpm issue-triage --dry-run https://github.com/sanity-io/sanity/issues/725
```

The script loads local `.env` files automatically without any extra tooling.
Shell-provided environment variables always win. Put Miriad credentials in either
location:

```bash
# Option 1: repository root (already used by other local tooling in this repo)
.env

# Option 2: script-local (keeps triage secrets scoped to this helper)
scripts/trigger-triage/.env
```

To use the script-local file, copy the example:

```bash
cp scripts/trigger-triage/.env.example scripts/trigger-triage/.env
```

The lookup order is:

1. Environment variables already set in the shell.
2. `scripts/trigger-triage/.env`.
3. Repository root `.env`.

Values from step 1 are never overwritten. Between the two `.env` files, the
script-local file is loaded first, so its values take precedence over the root
`.env` for any key defined in both.

## Hardcoded Agents

The Miriad agents are intentionally hardcoded in `src/index.ts`:

```ts
export const AGENT_NAMES = ['squiggler', 'triager'] as const
```

This keeps the GitHub workflow and repository settings small: agent assignment
is part of the script behavior, not deployment configuration. If another repo or
Miriad workspace uses different callsigns, update `AGENT_NAMES` before copying
or enabling the workflow there.

## Moving This To Another Repo

To reuse this setup in another repository:

1. Copy `scripts/trigger-triage/`.
2. Copy `.github/workflows/issue-triage.yml`.
3. Create a Miriad workspace for that repository. From the workspace you will get:
   - `MIRIAD_URL`
   - `MIRIAD_TOKEN`
   - `MIRIAD_SPACE_ID`
     Add these variables to the repository secrets.
4. Review `AGENT_NAMES` in `src/index.ts` and update the callsigns if the target
   Miriad workspace uses different agents.
5. Confirm the workflow passes `github.event.issue.html_url` to the CLI.
6. Confirm the manual `workflow_dispatch` input is still named `issue_url`.
7. Run a local dry-run against a real issue URL.
8. Smoke-test the workflow by opening a test issue or adding `needs-triage` to
   an existing issue.
9. Close the test issue and confirm the matching Miriad channel is archived.
