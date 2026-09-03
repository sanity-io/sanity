import {execFileSync} from 'node:child_process'

import {type Artifact, type WorkflowJob, type WorkflowRun} from './types'

const API_BASE_URL = 'https://api.github.com'

interface ApiRun {
  conclusion: string | null
  created_at: string
  display_title: string
  event: string
  head_branch: string
  html_url: string
  id: number
  pull_requests?: {number: number}[]
  run_attempt: number
  status: string
}

interface ApiJob {
  conclusion: string | null
  html_url: string
  id: number
  name: string
}

interface ApiArtifact {
  expired: boolean
  id: number
  name: string
  size_in_bytes: number
}

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

/** GitHub search-qualifier timestamp (`YYYY-MM-DDTHH:MM:SS+00:00`), the format `created=` ranges accept. */
function toSearchTimestamp(date: Date): string {
  return `${date.toISOString().slice(0, 19)}+00:00`
}

export class GitHubClient {
  readonly #repo: string
  readonly #token: string

  constructor(repo: string, token: string) {
    this.#repo = repo
    this.#token = token
  }

  /**
   * Completed and in-progress runs of a workflow created at or after `since` (newest first).
   * The endpoint returns at most 1000 results per query and this repo can exceed that in a
   * week, so the window is queried one day at a time.
   */
  async listWorkflowRuns(
    workflowFile: string,
    since: Date,
    until = new Date(),
  ): Promise<WorkflowRun[]> {
    const runsById = new Map<number, WorkflowRun>()
    const dayMs = 24 * 60 * 60 * 1000
    const windows: [Date, Date][] = []
    for (let start = since.getTime(); start < until.getTime(); start += dayMs) {
      windows.push([new Date(start), new Date(Math.min(start + dayMs, until.getTime()))])
    }

    const pages = await Promise.all(
      windows.map(([start, end]) => this.#listRunsBetween(workflowFile, start, end)),
    )
    for (const run of pages.flat()) runsById.set(run.id, run)

    return [...runsById.values()].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    )
  }

  async #listRunsBetween(workflowFile: string, start: Date, end: Date): Promise<WorkflowRun[]> {
    const runs: WorkflowRun[] = []
    const perPage = 100
    const created = encodeURIComponent(`${toSearchTimestamp(start)}..${toSearchTimestamp(end)}`)
    // Page numbers are sequential by nature: the next page only exists if this one was full.
    for (let page = 1; page <= 10; page += 1) {
      // oxlint-disable-next-line no-await-in-loop -- see above
      const body = await this.#getJson<{workflow_runs: ApiRun[]}>(
        `/repos/${this.#repo}/actions/workflows/${workflowFile}/runs?created=${created}&per_page=${perPage}&page=${page}`,
      )
      for (const run of body.workflow_runs) {
        runs.push({
          attempt: run.run_attempt,
          branch: run.head_branch,
          conclusion: run.conclusion,
          createdAt: run.created_at,
          event: run.event,
          id: run.id,
          prNumber: run.pull_requests?.[0]?.number,
          status: run.status,
          title: run.display_title,
          url: run.html_url,
        })
      }
      if (body.workflow_runs.length < perPage) break
    }
    return runs
  }

  async listJobs(runId: number): Promise<WorkflowJob[]> {
    const body = await this.#getJson<{jobs: ApiJob[]}>(
      `/repos/${this.#repo}/actions/runs/${runId}/jobs?per_page=100`,
    )
    return body.jobs.map((job) => ({
      conclusion: job.conclusion,
      id: job.id,
      name: job.name,
      url: job.html_url,
    }))
  }

  async listArtifacts(runId: number): Promise<Artifact[]> {
    const body = await this.#getJson<{artifacts: ApiArtifact[]}>(
      `/repos/${this.#repo}/actions/runs/${runId}/artifacts?per_page=100`,
    )
    return body.artifacts.map((artifact) => ({
      expired: artifact.expired,
      id: artifact.id,
      name: artifact.name,
      sizeInBytes: artifact.size_in_bytes,
    }))
  }

  /** Downloads an artifact as a zip. GitHub answers with a redirect to blob storage, which fetch follows. */
  async downloadArtifact(artifactId: number): Promise<Uint8Array> {
    const response = await this.#get(`/repos/${this.#repo}/actions/artifacts/${artifactId}/zip`)
    return new Uint8Array(await response.arrayBuffer())
  }

  async getJobLog(jobId: number): Promise<string> {
    const response = await this.#get(`/repos/${this.#repo}/actions/jobs/${jobId}/logs`)
    return response.text()
  }

  async #getJson<T>(path: string): Promise<T> {
    const response = await this.#get(path)
    return (await response.json()) as T
  }

  async #get(path: string): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${this.#token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'follow',
    })
    if (!response.ok) {
      throw new Error(`GitHub API ${response.status} for ${path}: ${await response.text()}`)
    }
    return response
  }
}
