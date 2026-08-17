import {execSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {MONOREPO_ROOT} from '@repo/utils'
import semver from 'semver'

import {type ReleaseType, getVersionBump} from '../getVersionBump'

export type SuffixType = 'timestamp' | 'commits-ahead'

interface BumpOptions {
  preid?: string
  suffixType?: SuffixType
  buildMetadata?: boolean
  dryRun?: boolean
}

export interface PnpmPackage {
  name: string
  version: string
  path: string
  private: boolean
}

interface GitInfo {
  commitHash: string
  commitCount: string
}

function readRootVersion(): string {
  const rootPkg = JSON.parse(readFileSync(join(MONOREPO_ROOT, 'package.json'), 'utf-8'))
  return rootPkg.version
}

function readGitInfo(): GitInfo {
  const commitHash = execSync('git rev-parse --short HEAD', {
    cwd: MONOREPO_ROOT,
    encoding: 'utf-8',
  }).trim()

  // scope to release tags (getVersionBump uses the same `v` prefix) so stray non-release tags
  // on main history can't reset the commit count. Must stay in sync with the `git describe`
  // in .github/workflows/release-next.yml.
  const tagInfo = execSync('git describe --tags --long --first-parent --match "v*"', {
    cwd: MONOREPO_ROOT,
    encoding: 'utf-8',
  }).trim()
  const match = tagInfo.match(/^.+-(\d+)-g[0-9a-f]+$/)
  const commitCount = match?.[1] ?? '0'

  return {commitHash, commitCount}
}

function getWorkspacePackages(): PnpmPackage[] {
  const output = execSync('pnpm ls -r --json --depth -1', {
    cwd: MONOREPO_ROOT,
    encoding: 'utf-8',
  })
  return selectPackagesToBump(JSON.parse(output))
}

// -- Pure computation --

/**
 * Every publishable package shares the root version, so selecting on `private` rather than on
 * "already matches the root version" means a package added at the wrong version still gets
 * bumped instead of being silently skipped and failing to publish. Private packages (dev
 * studios, @repo tooling) are left alone — they are not published and have long since drifted.
 */
export function selectPackagesToBump(packages: PnpmPackage[]): PnpmPackage[] {
  return packages.filter((pkg) => !pkg.private)
}

function zeroPad(value: number | string, length: number) {
  return String(value).padStart(length, '0')
}

function formatTimestamp(now: Date): string {
  return [
    zeroPad(now.getUTCFullYear(), 4),
    zeroPad(now.getUTCMonth() + 1, 2),
    zeroPad(now.getUTCDate(), 2),
    zeroPad(now.getUTCHours(), 2),
    zeroPad(now.getUTCMinutes(), 2),
    zeroPad(now.getUTCSeconds(), 2),
  ].join('')
}

export function computeVersion({
  currentVersion,
  semverIncrement,
  suffix,
  preid,
}: {
  currentVersion: string
  semverIncrement: ReleaseType
  preid: string | undefined
  suffix: string | undefined
}): string {
  const bumped = semver.inc(currentVersion, semverIncrement)
  if (!bumped)
    throw new Error(`Failed to compute ${semverIncrement} version from ${currentVersion}`)

  return preid ? `${bumped}-${preid}.${suffix}` : bumped
}

// Update package.json with a new version
function writeVersion(packagePath: string, newVersion: string): void {
  const pkgJsonPath = join(packagePath, 'package.json')
  const content = readFileSync(pkgJsonPath, 'utf-8')
  const pkg = JSON.parse(content)
  pkg.version = newVersion
  writeFileSync(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

export async function bump(options: BumpOptions = {}): Promise<void> {
  const {preid, suffixType = 'timestamp', buildMetadata = true, dryRun} = options

  const currentVersion = readRootVersion()
  const git = readGitInfo()
  const semverIncrement = await getVersionBump(MONOREPO_ROOT)
  const now = new Date()

  console.error(`Current version: ${currentVersion}`)
  console.error(`Semver increment: ${semverIncrement}`)

  // Compute new version
  const base = suffixType === 'commits-ahead' ? git.commitCount : formatTimestamp(now)
  const suffix = preid ? (buildMetadata ? `${base}+${git.commitHash}` : base) : undefined

  const newVersion = computeVersion({currentVersion, semverIncrement, preid, suffix})

  console.error(`New version: ${newVersion}`)

  if (dryRun) {
    console.error('Dry run — not writing any files')
    console.log(newVersion)
    return
  }

  // Write versions
  const packages = getWorkspacePackages()
  console.error(`Updating ${packages.length} packages`)

  for (const pkg of packages) {
    if (pkg.version !== currentVersion) {
      console.error(
        `Note: ${pkg.name} was at ${pkg.version}, not the root version ${currentVersion} — syncing it to ${newVersion}`,
      )
    }
    writeVersion(pkg.path, newVersion)
  }
  writeVersion(MONOREPO_ROOT, newVersion)

  console.log(newVersion)
}
