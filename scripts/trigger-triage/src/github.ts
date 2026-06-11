interface GitHubIssueUser {
  login: string
  type: string
}

interface GitHubIssueLabel {
  name: string
}

export interface GitHubIssue {
  number: number
  title: string
  body: string | null
  html_url: string
  state: 'open' | 'closed'
  created_at: string
  user: GitHubIssueUser
  labels: GitHubIssueLabel[]
  pull_request?: unknown
}

const ISSUE_URL_RE =
  /^https:\/\/github\.com\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)\/issues\/(\d+)(?:[#?/].*)?$/

export function parseIssueUrl(url: string): {
  owner: string
  repo: string
  issueNumber: number
} {
  const match = url.trim().match(ISSUE_URL_RE)
  if (!match) {
    throw new Error(
      `invalid GitHub issue URL: ${url}\n  expected: https://github.com/<owner>/<repo>/issues/<N>`,
    )
  }

  const [, owner, repo, issueNumber] = match
  return {owner, repo, issueNumber: Number.parseInt(issueNumber, 10)}
}

export interface FetchIssueOptions {
  owner: string
  repo: string
  issueNumber: number
  token?: string | undefined
  log?: (msg: string) => void
}

export async function fetchIssue(opts: FetchIssueOptions): Promise<GitHubIssue> {
  const {owner, repo, issueNumber, token, log} = opts
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'sanity-io-trigger-triage/0.1',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  log?.(`GET ${apiUrl}`)

  let res: Response
  try {
    res = await fetch(apiUrl, {headers})
  } catch (err) {
    throw new Error(`network error contacting GitHub: ${errorMessage(err)}`, {cause: err})
  }

  if (res.status === 404) {
    throw new Error(
      `issue not found: ${owner}/${repo}#${issueNumber} (private repo? set GITHUB_TOKEN locally)`,
    )
  }

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    throw new Error(
      `GitHub API rate-limited (status ${res.status}, x-ratelimit-remaining=${remaining ?? '?'}). Set GITHUB_TOKEN locally to raise the limit.`,
    )
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub API returned ${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
  }

  let issue: GitHubIssue
  try {
    issue = await res.json()
  } catch (err) {
    throw new Error(`failed to parse GitHub JSON response: ${errorMessage(err)}`, {cause: err})
  }

  if (issue.pull_request) {
    throw new Error(`${owner}/${repo}#${issueNumber} is a pull request, not an issue`)
  }

  return issue
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
