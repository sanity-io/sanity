#!/usr/bin/env node
// Usage: npx tsx scripts/createChangelogDocuments.ts

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
  dryRun?: boolean
  title?: string
}

interface ReleaseContext {
  version: string
  title: string
  product: string
  features: string[]
  bugfixes: string[]
  changelogOutput: string
}

interface PortableTextSpan {
  _key: string
  _type: 'span'
  marks: string[]
  text: string
}

interface PortableTextBlock {
  _key: string
  _type: 'block'
  children: PortableTextSpan[]
  markDefs: Array<{
    _key: string
    _type: string
    href: string
  }>
  style: string
  level?: number
  listItem?: string
}

// Parse command-line arguments
function parseArguments() {
  return yargs(hideBin(process.argv))
    .option('dryRun', {
      type: 'boolean',
      description: 'Show documents that would be created without actually creating them',
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
    .option('token', {
      type: 'string',
      description: 'Sanity auth token (alternative to SANITY_WEB_AUTH_TOKEN env var)',
    })
    .help().argv as ChangelogOptions & {debug?: boolean; token?: string}
}

// Extract commit data and categorize into features and bugfixes
function extractCommitData(): {features: string[]; bugfixes: string[]; changelogOutput: string} {
  // Get the latest tag
  const latestTag = execa.sync('git describe --abbrev=0', {shell: true}).stdout.trim()

  // Generate changelog from latest tag to next branch
  const CHANGELOG_COMMAND = `git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse ${latestTag}..origin/main`
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

  return {features, bugfixes, changelogOutput}
}

// Generate document structures for Sanity
function generateDocuments(releaseContext: ReleaseContext) {
  // Create the API version document
  const versionDocId = uuid()
  const versionDoc = {
    _id: versionDocId,
    _type: 'apiVersion',
    date: new Date().toISOString().split('T')[0],
    summary: `${releaseContext.product} v${releaseContext.version} release`,
    platform: {
      _type: 'reference',
      _ref: 'c91b88aa-f3eb-481f-879a-8a1cebc1297c',
    },
  }

  // Create the changelog entry document
  const documentChangelogId = uuid()
  const changeDoc = {
    _id: `drafts.${documentChangelogId}`,
    _type: 'apiChange',
    title: releaseContext.title,
    version: {
      _type: 'reference',
      _ref: versionDoc._id,
    },
    publishedAt: new Date().toISOString(),
    longDescription: generateLongDescription(releaseContext),
    githubReleaseNote: `This release includes various improvements and bug fixes.

For the complete changelog with details, please visit:
[www.sanity.io/changelog/${documentChangelogId}](https://www.sanity.io/changelog/${documentChangelogId})

## Install or upgrade Sanity Studio

To upgrade to this version, run one of the following commands:

\`\`\`bash
# Using npm
npm install sanity@latest

# Using pnpm
pnpm add sanity@latest

# Using yarn
yarn add sanity@latest

# Using bun
bun add sanity@latest
\`\`\`

To initiate a new Sanity Studio project or learn more about upgrading, please refer to our comprehensive guide on [Installing and Upgrading Sanity Studio](https://www.sanity.io/docs/upgrade).

📓 Full changelog
${releaseContext.changelogOutput}`,
  }

  return {versionDoc, changeDoc, documentChangelogId}
}

// Handle dry run output
function handleDryRun(versionDoc: any, changeDoc: any) {
  const changelogId = changeDoc._id.replace('drafts.', '')

  console.log('\n🔍 DRY RUN: Documents that would be created:\n')
  console.log('Version document:')
  console.log(JSON.stringify(versionDoc, null, 2))
  console.log('\nChangelog document:')
  console.log(JSON.stringify(changeDoc, null, 2))

  console.log(
    '\n⚠️ DRY RUN: No documents were created. Add documents by running without --dryRun\n',
  )

  return {changelogId}
}

async function main() {
  const flags = parseArguments()

  // Get current version
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const currentVersion = packageJson.version

  // Extract commit data
  const {features, bugfixes, changelogOutput} = extractCommitData()

  // Create release context
  const releaseContext: ReleaseContext = {
    version: currentVersion,
    title: flags.title || `Sanity Studio v${currentVersion}`,
    product: 'Sanity Studio',
    features,
    bugfixes,
    changelogOutput,
  }

  // Prepare Sanity documents
  let changelogId = ''

  // Generate document structures
  const {versionDoc, changeDoc} = generateDocuments(releaseContext)

  // In dry run mode, just output the documents
  if (flags.dryRun) {
    const dryRunResult = handleDryRun(versionDoc, changeDoc)
    changelogId = dryRunResult.changelogId
  } else {
    // Create Sanity documents
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
        '2. Set it in your environment: SANITY_WEB_AUTH_TOKEN=your-token npx tsx scripts/createChangelogDocuments.ts',
      )
      console.error(
        '3. Provide it as a command-line argument: npx tsx scripts/createChangelogDocuments.ts --token=your-token',
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
      changelogId = await createSanityChangelogDocuments(
        sanityConfig,
        versionDoc,
        changeDoc,
        flags.debug,
      )
      // Internal Studio URL for editing (shown in console)
      const studioUrl = `https://admin.sanity.io/structure/docs;changelog;apiChange;${changelogId}`
      console.log(`✅ Edit changelog entry in Studio: ${studioUrl}`)
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
  versionDoc: any,
  changeDoc: any,
  debug?: boolean,
): Promise<string> {
  const client = createClient(config)

  // Extract the changelog ID from the document ID
  const changelogId = changeDoc._id.replace('drafts.', '')

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
function generateLongDescription(context: ReleaseContext): PortableTextBlock[] {
  const blocks: PortableTextBlock[] = [
    // Highlights heading
    {
      _key: uuid(),
      _type: 'block' as const,
      children: [
        {
          _key: uuid(),
          _type: 'span' as const,
          marks: [],
          text: '✨ Highlights',
        },
      ],
      markDefs: [],
      style: 'h2',
    },
  ]

  // Add feature commits
  if (context.features.length > 0) {
    // Create a list block for features
    const featureListItems = context.features.map((commit) => {
      const [, message, hash] = commit.split(' | ')
      const blockKey = uuid()
      return {
        _key: blockKey,
        _type: 'block' as const,
        children: [
          {
            _key: `${blockKey}0`,
            _type: 'span' as const,
            marks: [],
            text: message.replace(/^feat(\([^)]*\))?:\s*/, ''),
          },
          {
            _key: `${blockKey}1`,
            _type: 'span' as const,
            marks: [],
            text: ' (',
          },
          {
            _key: `${blockKey}2`,
            _type: 'span' as const,
            marks: [hash],
            text: hash,
          },
          {
            _key: `${blockKey}3`,
            _type: 'span' as const,
            marks: [],
            text: ')',
          },
        ],
        level: 1,
        listItem: 'bullet',
        markDefs: [
          {
            _key: hash,
            _type: 'link',
            href: `https://github.com/sanity-io/sanity/commit/${hash}`,
          },
        ],
        style: 'normal',
      }
    })
    blocks.push(...featureListItems)
  } else {
    blocks.push({
      _key: uuid(),
      _type: 'block' as const,
      children: [
        {
          _key: uuid(),
          _type: 'span' as const,
          marks: [],
          text: 'No new features in this release.',
        },
      ],
      markDefs: [],
      style: 'normal',
    })
  }

  // Bug fixes heading
  blocks.push({
    _key: uuid(),
    _type: 'block' as const,
    children: [
      {
        _key: uuid(),
        _type: 'span' as const,
        marks: [],
        text: '🐛 Notable bugfixes',
      },
    ],
    markDefs: [],
    style: 'h2',
  })

  // Add bugfix commits
  if (context.bugfixes.length > 0) {
    // Create a list block for bugfixes
    const bugfixListItems = context.bugfixes.map((commit) => {
      const [, message, hash] = commit.split(' | ')
      const blockKey = uuid()
      return {
        _key: blockKey,
        _type: 'block' as const,
        children: [
          {
            _key: `${blockKey}0`,
            _type: 'span' as const,
            marks: [],
            text: message.replace(/^fix(\([^)]*\))?:\s*/, ''),
          },
          {
            _key: `${blockKey}1`,
            _type: 'span' as const,
            marks: [],
            text: ' (',
          },
          {
            _key: `${blockKey}2`,
            _type: 'span' as const,
            marks: [hash],
            text: hash,
          },
          {
            _key: `${blockKey}3`,
            _type: 'span' as const,
            marks: [],
            text: ')',
          },
        ],
        level: 1,
        listItem: 'bullet',
        markDefs: [
          {
            _key: hash,
            _type: 'link',
            href: `https://github.com/sanity-io/sanity/commit/${hash}`,
          },
        ],
        style: 'normal',
      }
    })
    blocks.push(...bugfixListItems)
  } else {
    blocks.push({
      _key: uuid(),
      _type: 'block' as const,
      children: [
        {
          _key: uuid(),
          _type: 'span' as const,
          marks: [],
          text: 'No bug fixes in this release.',
        },
      ],
      markDefs: [],
      style: 'normal',
    })
  }

  // Add installation instructions
  blocks.push(
    {
      _key: uuid(),
      _type: 'block' as const,
      children: [
        {
          _key: uuid(),
          _type: 'span' as const,
          marks: [],
          text: 'Install or upgrade Sanity Studio',
        },
      ],
      markDefs: [],
      style: 'h2',
    },
    {
      _key: uuid(),
      _type: 'block' as const,
      children: [
        {
          _key: uuid(),
          _type: 'span' as const,
          marks: [],
          text: 'To initiate a new Sanity Studio project or upgrade an existing one, please refer to our comprehensive guide on ',
        },
        {
          _key: uuid(),
          _type: 'span' as const,
          marks: ['installLink'],
          text: 'Installing and Upgrading Sanity Studio',
        },
        {
          _key: uuid(),
          _type: 'span' as const,
          marks: [],
          text: '.',
        },
      ],
      markDefs: [
        {
          _key: 'installLink',
          _type: 'link',
          href: 'https://www.sanity.io/docs/upgrade',
        },
      ],
      style: 'normal',
    },
  )

  return blocks
}

main()
