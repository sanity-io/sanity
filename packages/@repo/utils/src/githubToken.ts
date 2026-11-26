import {execFileSync} from 'node:child_process'

/**
 * Resolves a token from the environment (`GITHUB_TOKEN` in Actions, `GH_TOKEN` locally),
 * falling back to the `gh` CLI's stored login so developers need no extra setup.
 */
export function resolveGitHubToken(): string {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (fromEnv) return fromEnv

  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    throw new Error(
      'No GitHub token found. Set GITHUB_TOKEN / GH_TOKEN or log in with `gh auth login`.',
    )
  }
}
