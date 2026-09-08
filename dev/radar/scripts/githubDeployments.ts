/**
 * Pure builders/parsers for collecting test-studio deploy URLs from GitHub
 * (I/O lives in syncGitHistory.ts). Vercel builds dev/test-studio for every
 * commit and records a GitHub deployment whose latest status carries the
 * immutable URL — we only collect. The lookup asks each *commit* for its
 * deployments (one alias per sha, batched) rather than paging the repo's
 * tens of thousands of deployments.
 */

/**
 * GitHub environment names Vercel writes for the test-studio project — note
 * the en-dash. Renaming the Vercel project silently breaks this match; watch
 * the sync's deploy-URL count.
 */
export const DEPLOYMENT_ENVIRONMENTS = ['Production – test-studio', 'Preview – test-studio']

/** Aliases per GraphQL query — one call per incremental sync, backfill ≈ 42. */
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
  /** GitHub account the author email maps to — absent for unmapped emails. */
  authorLogin?: string
  /** GitHub's avatar URL — not derivable: bot avatars live under /in/<app-id>. */
  authorAvatarUrl?: string
}

/**
 * Map each sha to its enrichment. Unknown oids, skipped builds,
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
