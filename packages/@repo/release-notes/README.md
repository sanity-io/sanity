# @repo/release-notes

Internal tool for generating Sanity Studio release notes and changelog documents. It collects commits since the
previous semver tag, associates them with merged GitHub PRs, extracts the "Notes for release" section from PR
descriptions, and writes the results to the configured Sanity dataset.

## Usage

Run from the repo root with the package binary:

```bash
pnpm release-notes generate-changelog \
  --baseVersion 5.7.0 \
  --tentativeVersion 5.7.1 \
  --outputFormat pr-description
```

Arguments:

- `--baseVersion` (required): previous released version, used to select commits.
- `--tentativeVersion` (required): upcoming version string.
- `--outputFormat` (optional): set to `pr-description` to print a PR-ready summary.

## Environment Variables

Required:

- `RELEASE_NOTES_SANITY_PROJECT_ID`
- `RELEASE_NOTES_SANITY_DATASET`
- `RELEASE_NOTES_SANITY_TOKEN`
- `RELEASE_NOTES_ADMIN_STUDIO_URL`
- `GITHUB_TOKEN`

## Output

The command creates or updates:

- A changelog document with per-commit entries.
- An API version document referencing the changelog.
- A content release for the upcoming version.

When `--outputFormat pr-description` is provided, it prints a Markdown summary with a link to edit the draft
changelog in the admin studio.

## Development

```bash
pnpm --filter @repo/release-notes lint
pnpm --filter @repo/release-notes test
pnpm --filter @repo/release-notes check:types
```

## See also

[create-release-pr.yml](../../../.github/workflows/create-release-pr.yml)
