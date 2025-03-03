# Sanity Scripts

This directory contains various utility scripts for the Sanity project.

## Release Notes Template Generator

The `printReleaseNotesTemplate.ts` script generates a GitHub release notes template and creates corresponding changelog entries in Sanity Studio.

### Features

- Generates a GitHub release notes template based on git commit history
- Creates an `apiVersion` document in Sanity Studio
- Creates an `apiChange` document in Sanity Studio with changelog details
- Automatically categorizes commits into features and bugfixes
- Creates a structured changelog with highlights, features, and bugfixes
- Links the GitHub release notes to the Sanity changelog

### Usage

This script requires Node.js version 22 or above, which can run TypeScript files directly.

```bash
# Basic usage (dry run - doesn't create Sanity documents)
node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --dryRun

# Create Sanity documents and generate release notes
node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts

# Specify custom from/to tags and title
node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts \
  --from v3.15.0 \
  --to main \
  --title "Sanity Studio v3.16.0 - Performance Improvements"

# Debug mode - show document structure before creating
node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --debug

# Using a direct token instead of CLI config
node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --token "your-sanity-api-token"
```

Note: In Node.js v23+, the `--experimental-strip-types` flag is enabled by default, so you can run the script with just:

```bash
node --no-warnings scripts/printReleaseNotesTemplate.ts --dryRun
```

The `--no-warnings` flag suppresses the experimental feature warnings.

### Authentication

The script uses the following for authentication:

- Project ID: Hardcoded to "3do82whm"
- Dataset: Hardcoded to "next"
- Auth Token: Retrieved directly from your Sanity CLI configuration file at `~/.config/sanity/config.json`

To use the script, you must be logged in with the Sanity CLI:

```bash
# Login to Sanity CLI if you haven't already
sanity login
```

Alternatively, you can provide a token directly using the `--token` flag:

```bash
node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --token "your-sanity-api-token"
```

The script will automatically read your authentication token from the Sanity CLI configuration file.

### Options

- `--from`: Previous release tag (defaults to the latest tag)
- `--to`: Current release branch/tag (defaults to 'next' or current branch if on v3)
- `--dryRun`: Generate template without creating Sanity documents (defaults to false)
- `--title`: Custom title for the release (defaults to "Sanity Studio v{version}")
- `--product`: Product tag (defaults to "Sanity Studio")
- `--debug`: Show document structure before creating (defaults to false)
- `--token`: Sanity API token (overrides CLI config)

### Testing Document Structure

To test that the Sanity documents are created as expected, you have several options:

1. **Debug Mode**: Use the `--debug` flag to see the document structure before it's created:

   ```bash
   node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --debug
   ```

2. **Direct Token**: If you don't have the Sanity CLI set up, you can use a token directly:

   ```bash
   node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --token "your-sanity-api-token"
   ```

3. **Sanity Studio**: After creating documents, you can view them in the Sanity Studio:
   ```
   https://admin.sanity.io/structure/docs;changelog?perspective=rOVi7MsdW
   ```

### Requirements

- Node.js 22+ (for direct TypeScript execution)
- Sanity CLI authentication (run `sanity login` first)
- Git repository with commit history

### Workflow

1. The script extracts commit history between the specified tags/branches
2. It categorizes commits into features and bugfixes based on commit messages
3. It creates an `apiVersion` document in Sanity Studio
4. It creates an `apiChange` document with structured content in Sanity Studio
5. It generates a GitHub release template that links to the Sanity changelog

### Example Output

The GitHub release template will look like:

```
# Sanity Studio v3.16.0

This release includes various improvements and bug fixes.

For the complete changelog with all details, please visit:
[www.sanity.io/changelog/e215973b-784d-46a8-9f5d-6ffac4dc9ace](https://www.sanity.io/changelog/e215973b-784d-46a8-9f5d-6ffac4dc9ace)

## Install or upgrade Sanity Studio

To upgrade to this version, run:

pnpm add sanity@latest

To initiate a new Sanity Studio project or learn more about upgrading, please refer to our comprehensive guide on [Installing and Upgrading Sanity Studio](https://www.sanity.io/docs/upgrade).
```

This format drives traffic to the Sanity changelog where users can find the complete details of the release.

### URL Formats

The script uses two different URL formats:

1. **Public-facing URL** (used in GitHub release template):

   ```
   https://www.sanity.io/changelog/e215973b-784d-46a8-9f5d-6ffac4dc9ace
   ```

2. **Internal Studio URL** (for editing, shown in console output):
   ```
   https://admin.sanity.io/structure/docs;changelog;apiChange;e215973b-784d-46a8-9f5d-6ffac4dc9ace?perspective=rOVi7MsdW
   ```
