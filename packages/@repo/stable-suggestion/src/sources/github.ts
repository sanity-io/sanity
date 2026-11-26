import semver from 'semver'

import {toSourced} from '../sourced'
import {compareByAt} from '../time'
import {type History, type IssueReport, type LatestMove, type StablePromotion} from '../types'
import {type FetchImpl} from './npm'

const API_BASE_URL = 'https://api.github.com'
const REPOSITORY = 'sanity-io/sanity'
export const TAG_STABLE_WORKFLOW = 'tag-stable.yml'
const PAGE_SIZE = 100
const MAX_PAGES = 10
const SEARCH_RESULT_CAP = 1000
const PROMOTION_TITLE = /^Tag @stable - (\d+\.\d+\.\d+)$/
const LATEST_MOVE_TITLE = /^Tag @latest - (\d+\.\d+\.\d+)$/
const TAG_LATEST_WORKFLOW = 'tag-latest.yml'

export interface GitHubDeps {
  fetchImpl: FetchImpl
  token: string
  repository?: string
}

interface ApiWorkflowRun {
  display_title: string
  created_at: string
  conclusion: string | null
}

interface ApiIssue {
  number: number
  title: string
  body: string | null
  html_url: string
  created_at: string
  closed_at: string | null
  labels: ({name?: string} | string)[]
  pull_request?: unknown
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

export function mentionsVersion(text: string, version: string): boolean {
  return new RegExp(String.raw`(?<![\w.-])v?${escapeRegExp(version)}(?![\w-]|\.\d)`).test(text)
}

function normaliseTitledRuns(runs: ApiWorkflowRun[], title: RegExp): StablePromotion[] {
  return runs
    .filter((run) => run.conclusion === 'success')
    .flatMap((run): StablePromotion[] => {
      const match = title.exec(run.display_title)
      return match?.[1] ? [{version: match[1], at: run.created_at}] : []
    })
    .toSorted(compareByAt)
}

export function normalisePromotions(runs: ApiWorkflowRun[]): StablePromotion[] {
  return normaliseTitledRuns(runs, PROMOTION_TITLE)
}

export function normaliseLatestMoves(runs: ApiWorkflowRun[]): LatestMove[] {
  return normaliseTitledRuns(runs, LATEST_MOVE_TITLE)
}

export function normaliseIssues(issues: ApiIssue[], knownVersions: string[]): IssueReport[] {
  return issues
    .filter((issue) => issue.pull_request === undefined)
    .map((issue) => {
      const text = `${issue.title}\n${issue.body ?? ''}`
      return {
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        createdAt: issue.created_at,
        closedAt: issue.closed_at,
        labels: issue.labels.map((label) =>
          typeof label === 'string' ? label : (label.name ?? ''),
        ),
        versionsMentioned: knownVersions.filter((version) => mentionsVersion(text, version)),
      }
    })
    .toSorted((left, right) => left.number - right.number)
}

async function request(deps: GitHubDeps, pathAndQuery: string): Promise<Response> {
  const response = await deps.fetchImpl(`${API_BASE_URL}${pathAndQuery}`, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${deps.token}`,
      'User-Agent': 'sanity-stable-suggestion',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${pathAndQuery}`)
  }
  return response
}

async function getPages<Item, Page>(
  deps: GitHubDeps,
  buildPath: (page: number) => string,
  pickItems: (page: Page) => Item[],
  maxPages = MAX_PAGES,
): Promise<Item[]> {
  const pageNumbers = Array.from({length: maxPages}, (_unused, index) => index + 1)
  const collected = await pageNumbers.reduce<Promise<{items: Item[]; done: boolean}>>(
    async (previous, page) => {
      const state = await previous
      if (state.done) return state
      const body = (await (await request(deps, buildPath(page))).json()) as Page
      const items = pickItems(body)
      return {items: [...state.items, ...items], done: items.length < PAGE_SIZE}
    },
    Promise.resolve({items: [], done: false}),
  )
  return collected.items
}

function repositoryOf(deps: GitHubDeps): string {
  return deps.repository ?? REPOSITORY
}

async function fetchRuns<Run>(deps: GitHubDeps, workflow: string, status: string): Promise<Run[]> {
  return getPages<Run, {workflow_runs: Run[]}>(
    deps,
    (page) =>
      `/repos/${repositoryOf(deps)}/actions/workflows/${workflow}/runs?status=${status}&per_page=${PAGE_SIZE}&page=${page}`,
    (body) => body.workflow_runs,
  )
}

export function fetchStablePromotions(deps: GitHubDeps): Promise<History['stablePromotions']> {
  return toSourced(async () =>
    normalisePromotions(await fetchRuns<ApiWorkflowRun>(deps, TAG_STABLE_WORKFLOW, 'success')),
  )
}

export function fetchLatestMoves(deps: GitHubDeps): Promise<NonNullable<History['latestMoves']>> {
  return toSourced(async () =>
    normaliseLatestMoves(await fetchRuns<ApiWorkflowRun>(deps, TAG_LATEST_WORKFLOW, 'success')),
  )
}

export function monthWindows(from: Date, to: Date): {start: Date; end: Date}[] {
  const firstYear = from.getUTCFullYear()
  const firstMonth = from.getUTCMonth()
  const monthCount = (to.getUTCFullYear() - firstYear) * 12 + (to.getUTCMonth() - firstMonth) + 1
  return Array.from({length: monthCount}, (_unused, offset) => {
    const monthStart = Date.UTC(firstYear, firstMonth + offset, 1)
    const nextMonthStart = Date.UTC(firstYear, firstMonth + offset + 1, 1)
    return {
      start: new Date(Math.max(monthStart, from.getTime())),
      end: new Date(Math.min(nextMonthStart - 1000, to.getTime())),
    }
  })
}

function toSearchTimestamp(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`
}

async function searchWindow(
  deps: GitHubDeps,
  repository: string,
  start: Date,
  end: Date,
): Promise<ApiIssue[]> {
  const query = encodeURIComponent(
    `repo:${repository} is:issue created:${toSearchTimestamp(start)}..${toSearchTimestamp(end)}`,
  )
  const firstPage = (await (
    await request(deps, `/search/issues?q=${query}&per_page=${PAGE_SIZE}&page=1`)
  ).json()) as {total_count: number; items: ApiIssue[]}
  const splitPointMs = start.getTime() + Math.floor((end.getTime() - start.getTime()) / 2)
  if (firstPage.total_count > SEARCH_RESULT_CAP && end.getTime() - start.getTime() > 2000) {
    const [earlier, later] = await Promise.all([
      searchWindow(deps, repository, start, new Date(splitPointMs)),
      searchWindow(deps, repository, new Date(splitPointMs + 1000), end),
    ])
    return [...earlier, ...later]
  }
  if (firstPage.items.length < PAGE_SIZE) return firstPage.items
  const remaining = await getPages<ApiIssue, {items: ApiIssue[]}>(
    deps,
    (page) => `/search/issues?q=${query}&per_page=${PAGE_SIZE}&page=${page + 1}`,
    (body) => body.items,
    MAX_PAGES - 1,
  )
  return [...firstPage.items, ...remaining]
}

export function fetchIssues(
  deps: GitHubDeps,
  options: {from: Date; to: Date; knownVersions: string[]},
): Promise<History['issues']> {
  return toSourced(async () => {
    const perWindow = await Promise.all(
      monthWindows(options.from, options.to).map((window) =>
        searchWindow(deps, repositoryOf(deps), window.start, window.end),
      ),
    )
    const stableVersions = options.knownVersions.filter(
      (version) => semver.prerelease(version) === null,
    )
    return normaliseIssues(perWindow.flat(), stableVersions)
  })
}
