# Sanity Scripts

This directory contains various utility scripts for the Sanity project.

## Release Notes Template Generator

The `printReleaseNotesTemplate.ts` script generates a GitHub release notes template and creates corresponding changelog entries in Sanity Studio.

### Features

- Generates a GitHub release notes template based on git commit history
- Creates an `apiVersion` document in Sanity Studio
- Creates an `apiChange` document in Sanity Studio with changelog details (as a draft)
- Automatically categorizes commits into features and bugfixes using conventional commit format
- Creates a structured changelog with highlights, features, and bugfixes
- Links the GitHub release notes to the Sanity changelog

### Usage

This script requires Node.js version 22 or above, which can run TypeScript files directly.

```bash
# Basic usage (dry run - shows documents that would be created without actually creating them)
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

# Using a direct token instead of environment variable
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
- Auth Token: Retrieved from one of the following sources (in order of precedence):
  1. Command-line argument (`--token`)
  2. Environment variable (`SANITY_WEB_AUTH_TOKEN`)
  3. `.env` file in the project root

To use the script, you have three authentication options:

1. **Create a .env file** in the project root:

   ```
   SANITY_WEB_AUTH_TOKEN=your-sanity-api-token
   ```

2. **Set the environment variable** directly:

   ```bash
   SANITY_WEB_AUTH_TOKEN=your-sanity-api-token node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts
   ```

3. **Provide a token as a command-line argument**:
   ```bash
   node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --token "your-sanity-api-token"
   ```

### Options

- `--from`: Previous release tag (defaults to the latest tag)
- `--to`: Current release branch/tag (defaults to 'next')
- `--dryRun`: Show documents that would be created without actually creating them (defaults to false)
- `--title`: Custom title for the release (defaults to "Sanity Studio v{version}")
- `--product`: Product name (defaults to "Sanity Studio")
- `--debug`: Show document structure before creating (defaults to false)
- `--token`: Sanity auth token (alternative to SANITY_WEB_AUTH_TOKEN env var)

### Testing Document Structure

To test that the Sanity documents are created as expected, you have several options:

1. **Debug Mode**: Use the `--debug` flag to see the document structure before it's created:

   ```bash
   node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --debug
   ```

2. **Direct Token**: If you don't have authentication set up, you can use a token directly:

   ```bash
   node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts --token "your-sanity-api-token"
   ```

3. **Sanity Studio**: After creating documents, you can view them in the Sanity Studio:
   ```
   https://admin.sanity.io/structure/docs;changelog?perspective=rOVi7MsdW
   ```

### Requirements

- Node.js 22+ (for direct TypeScript execution)
- Sanity authentication token
- Git repository with commit history

### Workflow

1. The script extracts commit history between the specified tags/branches
2. It categorizes commits into features and bugfixes based on conventional commit messages
   - `feat:` messages go into features
   - `fix:` messages go into bugfixes
   - Other types of commits are filtered out
3. It creates an `apiVersion` document in Sanity Studio
4. It creates an `apiChange` document with structured content in Sanity Studio (as a draft)
