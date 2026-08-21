/**
 * Pure builders/parsers for collecting test-studio deploy URLs from GitHub
 * (no I/O — syncGitHistory.ts does the fetch). Vercel's Git integration
 * builds dev/test-studio for every commit and records it as a GitHub
 * deployment whose latest status carries the immutable deploy URL — we only
 * collect, nothing is built or deployed from here.
 *
 * Lookup direction matters: the repo has tens of thousands of deployments
 * (every PR push deploys several projects), so we ask each *commit* for its
 * deployments — one GraphQL query per batch of shas, one alias per sha —
 * instead of paging the deployment list.
 */

/**
 * GitHub environment names Vercel writes for the test-studio project — note
 * the en-dash. Main pushes deploy to Production, branch pushes to Preview; a
 * commit may carry either. Renaming the Vercel project breaks this match
 * (URLs silently stop resolving — watch the sync's "resolved a URL" count).
 */
export const DEPLOYMENT_ENVIRONMENTS = ['Production – test-studio', 'Preview – test-studio']

/** Aliases per GraphQL query — 200-commit sync = 4 calls, full backfill ≈ 42. */
export const GITHUB_DEPLOYMENTS_BATCH_SIZE = 50

const FULL_SHA_RE = /^[0-9a-f]{40}$/

/**
 * One query, one `c<index>` alias per sha. Shas are interpolated into the
 * query text, so anything but a full lowercase hex sha throws.
 */
export function buildDeploymentsQuery(shas: string[]): string {
  const environments = JSON.stringify(DEPLOYMENT_ENVIRONMENTS)
  const fields = shas
    .map((sha, index) => {
      if (!FULL_SHA_RE.test(sha)) {
        throw new Error(`Not a full lowercase sha: ${JSON.stringify(sha)}`)
      }
      return (
        `c${index}: object(oid: "${sha}") { ... on Commit { ` +
        `author { user { login avatarUrl(size: 132) } } ` +
        `deployments(environments: ${environments}, first: 5) { ` +
        `nodes { latestStatus { state environmentUrl } } } } }`
      )
    })
    .join(' ')
  return `query { repository(owner: "sanity-io", name: "sanity") { ${fields} } }`
}

interface DeploymentNode {
  latestStatus?: {state?: string; environmentUrl?: string | null} | null
}

export interface CommitGitHubInfo {
  /** First SUCCESS deployment URL — absent for skipped/unfinished builds. */
  testStudioUrl?: string
  /** GitHub account GitHub maps the author email to — absent for unmapped emails. */
  authorLogin?: string
  /**
   * GitHub's own avatar URL for that account — authoritative for every
   * account type (bots live under /in/<app-id>, which nothing can derive
   * from the commit metadata).
   */
  authorAvatarUrl?: string
}

/**
 * Map each sha to what GitHub knows about it: the deploy URL (first
 * deployment whose latest status is SUCCESS with a URL) and the author's
 * GitHub login. Unknown oids (null object), skipped builds (no nodes),
 * failed/in-progress deploys and unmapped author emails simply resolve
 * nothing for that part.
 */
export function parseCommitGitHubInfo(
  data: unknown,
  shas: string[],
): Map<string, CommitGitHubInfo> {
  const repository = (data as {repository?: Record<string, unknown>} | null)?.repository
  const info = new Map<string, CommitGitHubInfo>()
  if (!repository) return info
  shas.forEach((sha, index) => {
    const commit = repository[`c${index}`] as
      | {
          author?: {user?: {login?: string | null; avatarUrl?: string | null} | null} | null
          deployments?: {nodes?: (DeploymentNode | null)[] | null} | null
        }
      | null
      | undefined
    if (!commit) return
    const entry: CommitGitHubInfo = {}
    for (const node of commit.deployments?.nodes ?? []) {
      const status = node?.latestStatus
      if (status?.state === 'SUCCESS' && status.environmentUrl) {
        entry.testStudioUrl = status.environmentUrl
        break
      }
    }
    const login = commit.author?.user?.login
    if (login) entry.authorLogin = login
    const avatarUrl = commit.author?.user?.avatarUrl
    if (avatarUrl) entry.authorAvatarUrl = avatarUrl
    if (entry.testStudioUrl || entry.authorLogin || entry.authorAvatarUrl) info.set(sha, entry)
  })
  return info
}
