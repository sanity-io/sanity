// oxlint-disable no-console
import {execSync} from 'node:child_process'
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {join, relative} from 'node:path'

import {MONOREPO_ROOT} from '@repo/utils'
import {ConventionalChangelog} from 'conventional-changelog'

interface ChangelogOptions {
  version: string
  dryRun?: boolean
}

interface PnpmPackage {
  name: string
  version: string
  path: string
  private: boolean
}

/**
 * Number of header lines in CHANGELOG.md to preserve when prepending new entries.
 * Lines 1-4 are: title, blank, description, blank
 */
const HEADER_LINES = 4

const CHANGELOG_HEADER = `# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.
`

function getPublicPackages(): PnpmPackage[] {
  const output = execSync('pnpm ls -r --json --depth -1', {
    cwd: MONOREPO_ROOT,
    encoding: 'utf-8',
  })
  const packages: PnpmPackage[] = JSON.parse(output)
  return packages.filter((pkg) => !pkg.private)
}

async function generateChangelogEntry(version: string, path?: string): Promise<string> {
  const generator = new ConventionalChangelog(MONOREPO_ROOT)
  generator.loadPreset('conventionalcommits')
  generator.readRepository()
  generator.tags({prefix: 'v', skipUnstable: true})
  generator.options({releaseCount: 1})
  generator.context({version})

  if (path) {
    generator.commits({path})
  }

  const chunks: string[] = []
  for await (const chunk of generator.write()) {
    chunks.push(chunk)
  }
  return chunks.join('')
}

function hasCommits(entry: string): boolean {
  // An entry with actual commits will contain "### " sections (Features, Bug Fixes, etc.)
  return entry.includes('### ')
}

function prependToChangelog(changelogPath: string, entry: string): void {
  if (existsSync(changelogPath)) {
    const existing = readFileSync(changelogPath, 'utf-8')
    const lines = existing.split('\n')
    const header = lines.slice(0, HEADER_LINES).join('\n')
    const body = lines.slice(HEADER_LINES).join('\n')
    writeFileSync(changelogPath, `${header}\n${entry}${body}`)
  } else {
    writeFileSync(changelogPath, `${CHANGELOG_HEADER}\n${entry}`)
  }
}

export async function writeChangelogFiles(options: ChangelogOptions): Promise<void> {
  const {version, dryRun} = options

  console.error(`Generating changelog for v${version}`)

  // Generate full changelog for root
  const rootEntry = await generateChangelogEntry(version)

  if (dryRun) {
    console.error('Dry run — not writing any files')
    console.log(rootEntry)
    return
  }

  // Write to root CHANGELOG.md
  const rootChangelog = join(MONOREPO_ROOT, 'CHANGELOG.md')
  prependToChangelog(rootChangelog, rootEntry)
  console.error(`Updated ${rootChangelog}`)

  // Write to public packages that have changes, scoped to their directory
  const packages = getPublicPackages()
  let updatedCount = 1
  for (const pkg of packages) {
    const pkgRelPath = relative(MONOREPO_ROOT, pkg.path)
    const pkgEntry = await generateChangelogEntry(version, pkgRelPath)

    if (!hasCommits(pkgEntry)) {
      console.error(`Skipped ${pkg.name} (no changes)`)
      continue
    }

    const pkgChangelog = join(pkg.path, 'CHANGELOG.md')
    prependToChangelog(pkgChangelog, pkgEntry)
    console.error(`Updated ${pkgChangelog}`)
    updatedCount++
  }

  console.error(`Updated ${updatedCount} CHANGELOG.md files`)
}
