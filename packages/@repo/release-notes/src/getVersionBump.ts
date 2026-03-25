import {Bumper} from 'conventional-recommended-bump'

export type ReleaseType = 'major' | 'minor' | 'patch'

/**
 * Determine the semver bump type (major, minor, patch) from conventional commits
 * since the last stable tag.
 *
 * Uses `skipUnstable: true` so prerelease tags (e.g. v5.18.1-next.42) are ignored.
 * Falls back to 'patch' when no qualifying commits are found (matches lerna's --force-publish).
 */
export async function getVersionBump(cwd: string): Promise<ReleaseType> {
  const bumper = new Bumper(cwd)
  bumper.loadPreset('conventionalcommits')
  bumper.tag({prefix: 'v', skipUnstable: true})
  const result = await bumper.bump()
  if ('releaseType' in result) {
    return result.releaseType
  }
  // No qualifying commits found — default to patch (matches lerna's --force-publish)
  return 'patch'
}
