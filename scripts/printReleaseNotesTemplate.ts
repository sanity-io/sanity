#!/usr/bin/env node
// This script requires Node.js 22+ with the --experimental-strip-types flag
// (In Node.js 23+, this flag is enabled by default)
// Use --no-warnings flag to suppress experimental feature warnings
// Example: node --no-warnings --experimental-strip-types scripts/printReleaseNotesTemplate.ts

// Using require instead of import to avoid ESM issues
const execa = require('execa')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const {createClient} = require('@sanity/client')
const {uuid} = require('@sanity/uuid')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

// Hardcoded project ID and dataset
const PROJECT_ID = '3do82whm'
const DATASET = 'next'

// Get auth token from Sanity CLI config file
function getSanityAuthToken() {
  try {
    // Determine the config file path
    const configDir = path.join(os.homedir(), '.config', 'sanity')
    const configPath = path.join(configDir, 'config.json')

    if (!fs.existsSync(configPath)) {
      throw new Error(`Sanity config file not found at ${configPath}`)
    }

    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const token = configData.authToken

    if (!token) {
      throw new Error('No auth token found in Sanity CLI config')
    }

    return token
  } catch (err) {
    console.error('Error retrieving auth token:', err.message)
    console.error('Please make sure you are logged in with the Sanity CLI (run `sanity login`)')
    return null
  }
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
      description: 'Git tag to use as starting point for changelog',
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
    .option('product', {
      type: 'string',
      description: 'Product tag (e.g., "Sanity Studio")',
      default: 'Sanity Studio',
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
      description: 'Sanity API token (overrides CLI config)',
    })
    .help().argv as ChangelogOptions & {debug?: boolean; preview?: boolean; token?: string}

  // Determine base branch and previous release
  const revParsed = execa.sync('git rev-parse --abbrev-ref HEAD', {shell: true}).stdout.trim()
  const isFromV3 = revParsed === 'v3' || revParsed === 'v3-current'
  const BASE_BRANCH = flags.to || (isFromV3 ? revParsed : 'next')
  const PREV_RELEASE =
    flags.from || execa.sync('git describe --abbrev=0', {shell: true}).stdout.trim()

  // Get current version
  const packageJson = require('../package.json')
  const currentVersion = packageJson.version

  // Generate changelog
  const CHANGELOG_COMMAND = `git log --pretty=format:'%aN | %s | %h' --abbrev-commit --reverse ${PREV_RELEASE}..origin/${BASE_BRANCH}`
  const changelogOutput = execa.sync(CHANGELOG_COMMAND, {shell: true}).stdout

  // Extract feature and bugfix commits for highlights
  const commits = changelogOutput.split('\n').filter((line: string) => line.trim() !== '')
  const features = commits.filter((commit: string) => {
    const message = commit.split(' | ')[1].toLowerCase()
    return message.includes('feat') || message.includes('feature') || message.includes('add')
  })
  const bugfixes = commits.filter((commit: string) => {
    const message = commit.split(' | ')[1].toLowerCase()
    return message.includes('fix') || message.includes('bug') || message.includes('issue')
  })

  // Create release context
  const releaseContext: ReleaseContext = {
    version: currentVersion,
    title: flags.title || `Sanity Studio v${currentVersion}`,
    product: flags.product || 'Sanity Studio',
    features,
    bugfixes,
    changelogOutput,
  }

  // Create Sanity documents if not in dry run mode
  let changelogUrl = ''
  let changelogId = ''
  if (!flags.dryRun) {
    // Get auth token from CLI config or from flag
    const token = flags.token || getSanityAuthToken()

    if (!token) {
      console.error(
        'Error: No auth token found. Please run `sanity login` or provide a token with --token',
      )
      process.exit(1)
    }

    const sanityConfig = {
      projectId: PROJECT_ID,
      dataset: DATASET,
      token,
      useCdn: false,
      apiVersion: '2023-03-15',
    }

    try {
      changelogId = await createSanityChangelogDocuments(sanityConfig, releaseContext, flags.debug)
      // Internal Studio URL for editing (shown in console)
      const studioUrl = `https://admin.sanity.io/structure/docs;changelog;apiChange;${changelogId}?perspective=rOVi7MsdW`
      // Public-facing URL for the changelog (used in GitHub release template)
      changelogUrl = `https://www.sanity.io/changelog/${changelogId}`
      console.log(`✅ Created changelog entry: ${changelogUrl}`)
      console.log(`✅ Edit in Studio: ${studioUrl}`)
    } catch (error) {
      console.error('Error creating Sanity documents:', error)
      process.exit(1)
    }
  }

  // Generate GitHub release template
  if (!flags.preview) {
    const releaseTemplate = generateGitHubReleaseTemplate(releaseContext, changelogUrl, changelogId)

    console.log(`
-------- SANITY RELEASE NOTES TEMPLATE --------
Use the following template as a starting point for next release:
A draft can be created here: https://github.com/sanity-io/sanity/releases/new

-------- BEGIN TEMPLATE --------
${releaseTemplate}
-------- END TEMPLATE --------`)
  }
}

async function createSanityChangelogDocuments(
  config: any,
  context: ReleaseContext,
  debug?: boolean,
): Promise<string> {
  const client = createClient(config)

  // Create a unique ID for the changelog entry
  const changelogId = uuid()

  // First, create the API version document
  const versionDoc = {
    _id: `apiVersion-${context.version}`,
    _type: 'apiVersion',
    semver: context.version,
    date: new Date().toISOString().split('T')[0],
    summary: `${context.product} v${context.version} release`,
    platform: {
      _type: 'reference',
      _ref: 'apiPlatform-sanity-studio', // Assuming this exists, adjust if needed
    },
  }

  // Create the changelog entry document with a more detailed structure
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
  try {
    if (debug) {
      console.log('Version document:', versionDoc)
      console.log('Changelog document:', changeDoc)
    }

    await client.createOrReplace(versionDoc)
    console.log(`Created version document: ${versionDoc._id}`)

    await client.createOrReplace(changeDoc)
    console.log(`Created changelog document: ${changelogId} (as draft)`)

    return changelogId
  } catch (error) {
    console.error('Error creating Sanity documents:', error)
    throw error
  }
}

function generateLongDescription(context: ReleaseContext) {
  const {version, features, bugfixes} = context
  const blocks = []

  // Add version header
  blocks.push({
    _type: 'block',
    style: 'h2',
    _key: uuid(),
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: uuid(),
        text: `✨ Highlights for v${version}`,
        marks: [],
      },
    ],
  })

  // Add description paragraph
  blocks.push({
    _type: 'block',
    style: 'normal',
    _key: uuid(),
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: uuid(),
        text: `This release includes various improvements and bug fixes. See below for details.`,
        marks: [],
      },
    ],
  })

  // Add features section if there are features
  if (features.length > 0) {
    blocks.push({
      _type: 'block',
      style: 'h3',
      _key: uuid(),
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: uuid(),
          text: 'New Features',
          marks: [],
        },
      ],
    })

    // Add feature list
    const featureListItems = features.slice(0, 5).map((feature: string) => {
      const [, message] = feature.split(' | ')
      return {
        _type: 'block',
        style: 'normal',
        _key: uuid(),
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: uuid(),
            text: message,
            marks: [],
          },
        ],
      }
    })

    blocks.push(...featureListItems)
  }

  // Add bugfixes section if there are bugfixes
  if (bugfixes.length > 0) {
    blocks.push({
      _type: 'block',
      style: 'h3',
      _key: uuid(),
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: uuid(),
          text: 'Bug Fixes',
          marks: [],
        },
      ],
    })

    // Add bugfix list
    const bugfixListItems = bugfixes.slice(0, 5).map((bugfix: string) => {
      const [, message] = bugfix.split(' | ')
      return {
        _type: 'block',
        style: 'normal',
        _key: uuid(),
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: uuid(),
            text: message,
            marks: [],
          },
        ],
      }
    })

    blocks.push(...bugfixListItems)
  }

  // Add installation instructions
  blocks.push({
    _type: 'block',
    style: 'h3',
    _key: uuid(),
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: uuid(),
        text: 'Installation',
        marks: [],
      },
    ],
  })

  blocks.push({
    _type: 'block',
    style: 'normal',
    _key: uuid(),
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: uuid(),
        text: `To upgrade to this version, run:`,
        marks: [],
      },
    ],
  })

  blocks.push({
    _type: 'block',
    style: 'normal',
    _key: uuid(),
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: uuid(),
        text: `pnpm add sanity@latest`,
        marks: ['code'],
      },
    ],
  })

  return blocks
}

function generateGitHubReleaseTemplate(
  context: ReleaseContext,
  changelogUrl: string,
  changelogId: string,
): string {
  const {version} = context

  // Create a more generalized GitHub release template that drives traffic to the full changelog
  const template = `
# Sanity Studio v${version}

This release includes various improvements and bug fixes.

For the complete changelog with all details, please visit:
[www.sanity.io/changelog/${changelogId}](${changelogUrl || `https://www.sanity.io/changelog/${changelogId}`})

## Install or upgrade Sanity Studio

To upgrade to this version, run:

\`\`\`bash
pnpm add sanity@latest
\`\`\`

To initiate a new Sanity Studio project or learn more about upgrading, please refer to our comprehensive guide on [Installing and Upgrading Sanity Studio](https://www.sanity.io/docs/upgrade).
`

  return template
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
