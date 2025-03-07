#!/usr/bin/env node
// This script requires Node.js 22+ with the --experimental-strip-types flag
// (In Node.js 23+, this flag is enabled by default)
// Use --no-warnings flag to suppress experimental feature warnings
// Example: node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts

// Using ES module imports
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {createClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import dotenv from 'dotenv'
import execa from 'execa'
import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

// For loading package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from .env.local file in the project root
dotenv.config({path: path.join(__dirname, '..', '.env.local')})

// Hardcoded project ID and dataset
const PROJECT_ID = '3do82whm'
const DATASET = 'next'

// Get auth token from environment variable
// NOTE: This environment variable needs to be added to the root turbo.json
// under the "globalEnv" array to resolve the linter error
function getSanityAuthToken(): string | null {
  const envToken = process.env.SANITY_WEB_AUTH_TOKEN
  return envToken || null
}

interface ChangelogOptions {
  from?: string
  to?: string
  dryRun?: boolean
  title?: string
  product?: string
}

interface ReleaseContext {
  version: string
  title: string
  product: string
  features: string[]
  bugfixes: string[]
  changelogOutput: string
}

async function main() {
  const flags = yargs(hideBin(process.argv))
    .option('from', {
      type: 'string',
      description: 'Previous release tag (defaults to latest tag)',
    })
    .option('to', {
      type: 'string',
      description: 'Current release branch/tag',
      default: 'next',
    })
    .option('dryRun', {
      type: 'boolean',
      description: 'Generate template without creating Sanity documents',
      default: false,
    })
    .option('title', {
      type: 'string',
      description: 'Title for the release',
      default: '',
    })
    .option('debug', {
      type: 'boolean',
      description: 'Show document structure before creating',
      default: false,
    })
    .option('preview', {
      type: 'boolean',
      description: 'Fetch and display existing documents without creating new ones',
      default: false,
    })
    .option('token', {
      type: 'string',
      description: 'Sanity auth token (alternative to SANITY_WEB_AUTH_TOKEN env var)',
    })
    .help().argv as ChangelogOptions & {debug?: boolean; preview?: boolean; token?: string}

  // Determine base branch and previous release
  const revParsed = execa.sync('git rev-parse --abbrev-ref HEAD', {shell: true}).stdout.trim()
  // Simplified to use 'next' as default base branch based on PR feedback
  const BASE_BRANCH = flags.to || 'next'
  const PREV_RELEASE =
    flags.from || execa.sync('git describe --abbrev=0', {shell: true}).stdout.trim()

  // TODO: The file is missing createSanityChangelogDocuments function referenced
  // later in the code, causing linter errors. This needs to be restored.

  // Get current version
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const currentVersion = packageJson.version

  // Generate changelog
  const CHANGELOG_COMMAND = `git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse ${PREV_RELEASE}..origin/${BASE_BRANCH}`
  const changelogOutput = execa.sync(CHANGELOG_COMMAND, {shell: true}).stdout

  // Extract feature and bugfix commits for highlights
  const commits = changelogOutput.split('\n').filter((line: string) => line.trim() !== '')

  // Parse commits using conventional commit format
  const features = []
  const bugfixes = []

  for (const commit of commits) {
    const parts = commit.split(' | ')
    if (parts.length < 2) continue

    const message = parts[1]
    // Check for conventional commit format: type(scope): message
    const conventionalMatch = message.match(
      /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\([^)]*\))?:\s*(.*)$/i,
    )

    if (conventionalMatch) {
      const type = conventionalMatch[1].toLowerCase()

      if (type === 'feat') {
        features.push(commit)
      } else if (type === 'fix') {
        bugfixes.push(commit)
      }
      // Other types (chore, docs, etc.) are ignored
    } else {
      // Fallback to basic keyword matching only if not a conventional commit
      const lowerMessage = message.toLowerCase()
      if (lowerMessage.includes('feat') || lowerMessage.includes('feature')) {
        features.push(commit)
      } else if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) {
        bugfixes.push(commit)
      }
    }
  }

  // Create release context
  const releaseContext: ReleaseContext = {
    version: currentVersion,
    title: flags.title || `Sanity Studio v${currentVersion}`,
    product: 'Sanity Studio',
    features,
    bugfixes,
    changelogOutput,
  }

  // Create Sanity documents if not in dry run mode
  let changelogUrl = ''
  let changelogId = ''
  if (!flags.dryRun) {
    // Get auth token from environment variable or from flag
    const token = flags.token || getSanityAuthToken()

    if (!token) {
      console.error(
        'Error: No auth token found. Please set the SANITY_WEB_AUTH_TOKEN environment variable or provide a token with --token',
      )
      console.error('You can:')
      console.error(
        '1. Create a .env file in the project root with SANITY_WEB_AUTH_TOKEN=your-token',
      )
      console.error(
        '2. Set it in your environment: SANITY_WEB_AUTH_TOKEN=your-token node scripts/printReleaseNotesTemplate.ts',
      )
      console.error(
        '3. Provide it as a command-line argument: node scripts/printReleaseNotesTemplate.ts --token=your-token',
      )
      process.exit(1)
    }

    const sanityConfig = {
      projectId: PROJECT_ID,
      dataset: DATASET,
      token,
      useCdn: false,
      apiVersion: '2025-03-06',
    }

    try {
      changelogId = await createSanityChangelogDocuments(sanityConfig, releaseContext, flags.debug)
      // Internal Studio URL for editing (shown in console)
      const studioUrl = `https://admin.sanity.io/structure/docs;changelog;apiChange;${changelogId}`
      // Public-facing URL for the changelog (used in GitHub release template)
      changelogUrl = `https://www.sanity.io/changelog/${changelogId}`
      console.log(`✅ Created changelog entry: ${changelogUrl}`)
      console.log(`✅ Edit in Studio: ${studioUrl}`)
    } catch (error) {
      console.error('Error creating changelog documents:', error)
      process.exit(1)
    }
  }
}

/**
 * Creates Sanity changelog documents for a release
 */
async function createSanityChangelogDocuments(
  config: any,
  context: ReleaseContext,
  debug?: boolean,
): Promise<string> {
  const client = createClient(config)

  // Create a unique ID for the version document
  const versionId = uuid()
  // Create a unique ID for the changelog entry
  const changelogId = uuid()

  // First, create the API version document
  const versionDoc = {
    _id: versionId,
    _type: 'apiVersion',
    semver: context.version,
    date: new Date().toISOString().split('T')[0],
    summary: `${context.product} v${context.version} release`,
    platform: {
      _type: 'reference',
      _ref: 'c91b88aa-f3eb-481f-879a-8a1cebc1297c',
    },
  }

  // Create the changelog entry document
  const changeDoc = {
    _id: `drafts.${changelogId}`,
    _type: 'apiChange',
    title: context.title,
    version: {
      _type: 'reference',
      _ref: versionDoc._id,
    },
    publishedAt: new Date().toISOString(),
    longDescription: generateLongDescription(context),
  }

  // Create the documents in Sanity
  if (debug) {
    console.log('Version document:', versionDoc)
    console.log('Changelog document:', changeDoc)
  }

  await client.createOrReplace(versionDoc)
  console.log(`Created version document: ${versionDoc._id}`)

  await client.createOrReplace(changeDoc)
  console.log(`Created changelog document: ${changelogId} (as draft)`)

  return changelogId
}

/**
 * Generates long description for the changelog entry
 */
function generateLongDescription(context: ReleaseContext) {
  // Simple implementation - you can expand this as needed
  return [
    {
      _type: 'block',
      children: [{_type: 'span', text: `${context.product} v${context.version}`}],
    },
  ]
}

main()
