/**
 * The Bisect tool's slice of the dataset: every synced commit (tight
 * projection — never anything heavy), the session list (summary only; the
 * marks array is fetched per session), and the release tags used as endpoint
 * shortcuts.
 */
import {type BisectCommit} from './bisect'

export interface GitCommitSlice {
  _id: string
  sha: string
  parentSha: string | null
  committedAt: string
  subject: string
  prNumber: number | null
  authorName: string | null
  authorEmail: string | null
  authorLogin: string | null
  authorAvatarUrl: string | null
  testStudioUrl: string | null
}

/**
 * All ~2k synced commits — accepted for now (tight projection); scope by the
 * endpoint dates if the dataset outgrows this. Newest first feeds the picker.
 */
export const BISECT_COMMITS_QUERY = `*[_type == "gitCommit"] | order(committedAt desc) {
  _id, sha, parentSha, committedAt, subject, prNumber, authorName, authorEmail, authorLogin, authorAvatarUrl, testStudioUrl
}`

export interface SessionEndpoint {
  sha: string
  label?: string | null
}

export interface SessionSummary {
  _id: string
  title: string | null
  good: SessionEndpoint | null
  bad: SessionEndpoint | null
  createdAt: string | null
  createdBy: string | null
  markCount: number | null
  result: {
    firstBadSha: string | null
    regression: boolean | null
    linearIssue: string | null
  } | null
  resultSubject: string | null
}

/** Summary only — `marks` is deliberately not projected here (SessionView fetches the full doc). */
export const BISECT_SESSIONS_QUERY = `*[_type == "bisectSession"] | order(createdAt desc) {
  _id, title, good{sha, label}, bad{sha, label}, createdAt, createdBy,
  "markCount": count(marks),
  result{firstBadSha, regression, linearIssue},
  "resultSubject": *[_type == "gitCommit" && sha == ^.result.firstBadSha][0].subject
}`

export interface SessionDocument {
  _id: string
  title: string | null
  good: SessionEndpoint | null
  bad: SessionEndpoint | null
  releasesOnly: boolean | null
  marks: {_key: string; sha: string; verdict: string}[] | null
  result: {
    firstBadSha: string
    regression: boolean | null
    description: string | null
    linearIssue: string | null
  } | null
  createdAt: string | null
  createdBy: string | null
}

export const BISECT_SESSION_QUERY = `*[_id == $id][0] {
  _id, title, good{sha, label}, bad{sha, label}, releasesOnly,
  marks[]{_key, sha, verdict},
  result{firstBadSha, regression, description, linearIssue},
  createdAt, createdBy
}`

export interface TagSlice {
  _id: string
  tag: string
  sha: string
  taggedAt: string
  npm: {
    publishedAt: string | null
    distTags: string[] | null
    weeklyDownloads: number | null
  } | null
}

export const BISECT_TAGS_QUERY = `*[_type == "gitTag"] | order(taggedAt desc) {
  _id, tag, sha, taggedAt, npm{publishedAt, distTags, weeklyDownloads}
}`

/** GROQ nulls → the engine's optional fields (tools/bisect/bisect.ts). */
export function toBisectCommit(slice: GitCommitSlice): BisectCommit {
  return {
    sha: slice.sha,
    parentSha: slice.parentSha ?? undefined,
    subject: slice.subject,
    authorName: slice.authorName ?? undefined,
    authorEmail: slice.authorEmail ?? undefined,
    authorLogin: slice.authorLogin ?? undefined,
    authorAvatarUrl: slice.authorAvatarUrl?.startsWith('https://')
      ? slice.authorAvatarUrl
      : undefined,
    committedAt: slice.committedAt,
    prNumber: slice.prNumber ?? undefined,
    // The URL is rendered straight into hrefs — refuse anything but https
    // so a poisoned document can't smuggle a javascript: link
    testStudioUrl: slice.testStudioUrl?.startsWith('https://') ? slice.testStudioUrl : undefined,
  }
}

/**
 * Endpoint-picker search: sha prefix (case-insensitive) or subject substring.
 */
export function filterCommits(
  commits: GitCommitSlice[],
  query: string,
  limit = 20,
): GitCommitSlice[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return commits.slice(0, limit)
  return commits
    .filter(
      (commit) => commit.sha.startsWith(needle) || commit.subject.toLowerCase().includes(needle),
    )
    .slice(0, limit)
}
