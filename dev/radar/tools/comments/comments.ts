/**
 * Comments on commits: the studio's native comments (`comment` documents in
 * the workspace's comments addon dataset) targeting a `gitCommit` document.
 * Radar adds nothing to how they are written — the run dialog and the bisect
 * stepper mount the studio's own comments provider and list on the commit's
 * document — but it reads them all at once to draw markers on the charts, and
 * that aggregate view is what this module shapes.
 *
 * The anchor is the commit sha: `target.document._ref` is the `gitCommit` id
 * (`git-commit-<sha>`, see `@repo/utils/radar-ids`), so a thread on a commit
 * surfaces wherever that commit does. Pure functions here (positioning,
 * filtering, excerpts) are unit tested.
 */
import {GIT_COMMIT_ID_PREFIX} from '@repo/utils/radar-ids'
import {type PortableTextBlock} from 'sanity'

/** One `comment` document as the charts need it. */
export interface CommitComment {
  _id: string
  /** Full 40-char sha of the commit the thread is on. */
  sha: string
  threadId: string
  /** Set on replies — the charts count threads by their parent comment. */
  parentCommentId: string | null
  status: 'open' | 'resolved'
  authorId: string
  message: PortableTextBlock[] | null
  createdAt: string
  /**
   * The one chart this thread is about (`TrendSeries.key`), stamped into
   * `context.payload.seriesKey` by the run dialog's composer. Undefined = the
   * commit as a whole, shown on every chart. Replies carry none; the parent
   * decides.
   */
  seriesKey?: string
  /**
   * When the commit landed (from its `gitCommit` document) — where the marker
   * sits when no run in the chart measured the commit. Undefined until the
   * join to the bench dataset has resolved, or when the commit is unknown.
   */
  committedAt?: string
}

/**
 * Every comment on a `gitCommit`, oldest first, from the addon dataset. The
 * addon dataset is separate from the bench dataset, so the commit's date is
 * joined client-side (see useLiveCommitComments) rather than in GROQ.
 */
export const COMMIT_COMMENTS_QUERY = `*[_type == "comment" && target.documentType == "gitCommit"]
  | order(_createdAt asc) {
  _id, threadId, parentCommentId, status, authorId, message,
  "createdAt": _createdAt,
  "documentId": target.document._ref,
  "seriesKey": context.payload.seriesKey
}`

/** The `gitCommit` document a comment targets, back to its sha. */
export function shaFromCommitDocumentId(documentId: string): string | undefined {
  if (!documentId.startsWith(GIT_COMMIT_ID_PREFIX)) return undefined
  const sha = documentId.slice(GIT_COMMIT_ID_PREFIX.length)
  return /^[0-9a-f]{40}$/.test(sha) ? sha : undefined
}

/** A commit's comment threads resolved to a position on a chart's time axis. */
export interface ResolvedCommitComments {
  sha: string
  /** Parent comments only — one per thread, oldest first. */
  threads: CommitComment[]
  /** Where to draw the marker, as a time on the chart's x-axis. */
  atMs: number
  /**
   * True when a run in this chart measured the commit, so the marker sits on
   * that run's point rather than at the commit's own date.
   */
  measured: boolean
}

/** Does a thread belong on this chart: about the commit as a whole, or about this very series. */
export function threadBelongsOnChart(
  thread: CommitComment,
  seriesKey: string | undefined,
): boolean {
  return seriesKey === undefined || !thread.seriesKey || thread.seriesKey === seriesKey
}

/**
 * The parent comments (one per thread) on one commit, oldest first. With a
 * `seriesKey`, only the threads that belong on that chart; without one (the
 * bisect stepper, where the commit is the subject), all of them.
 */
export function threadsForSha(
  comments: CommitComment[],
  sha: string,
  seriesKey?: string,
): CommitComment[] {
  return comments.filter(
    (comment) =>
      comment.sha === sha && !comment.parentCommentId && threadBelongsOnChart(comment, seriesKey),
  )
}

/**
 * The comment markers a chart draws: one per commented commit, anchored to the
 * run that measured the commit where one exists, placed at the commit's date
 * otherwise, filtered to the chart's x-domain and ordered by drawn position.
 *
 * Same pipeline as `resolveTagPositions` in tools/trends/data.ts, for the same
 * reasons: anchor first, then filter, so a thread on a commit measured just
 * inside the window is not dropped because the commit itself landed outside
 * it; and the array must agree with what is drawn, since the tooltip and the
 * aria-label read it. A commit whose date is still unknown and that no run
 * measured has no position and is left out. With a `seriesKey`, threads
 * scoped to another chart are left out too.
 */
export function resolveCommentPositions(
  comments: CommitComment[],
  points: {sha: string; date: Date}[],
  minDateMs: number,
  maxDateMs: number,
  seriesKey?: string,
): ResolvedCommitComments[] {
  const measuredBySha = new Map<string, number>()
  for (const point of points) {
    // Earliest run wins, so a re-measured commit keeps a stable marker
    const ms = point.date.getTime()
    const existing = measuredBySha.get(point.sha)
    if (existing === undefined || ms < existing) measuredBySha.set(point.sha, ms)
  }
  const bySha = new Map<string, CommitComment[]>()
  for (const comment of comments) {
    if (comment.parentCommentId || !threadBelongsOnChart(comment, seriesKey)) continue
    const list = bySha.get(comment.sha) ?? []
    list.push(comment)
    bySha.set(comment.sha, list)
  }
  return [...bySha.entries()]
    .map(([sha, threads]) => {
      const sorted = [...threads].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const measuredAt = measuredBySha.get(sha)
      if (measuredAt !== undefined) return {sha, threads: sorted, atMs: measuredAt, measured: true}
      const committedAt = sorted.find((thread) => thread.committedAt)?.committedAt
      return {
        sha,
        threads: sorted,
        atMs: committedAt ? Date.parse(committedAt) : Number.NaN,
        measured: false,
      }
    })
    .filter(
      (entry) => Number.isFinite(entry.atMs) && entry.atMs >= minDateMs && entry.atMs <= maxDateMs,
    )
    .sort((a, b) => a.atMs - b.atMs)
}

/** The commented commits whose marker sits within `toleranceMs` of a run — for that run's tooltip. */
export function commentsNearRun(
  resolved: ResolvedCommitComments[],
  runMs: number,
  toleranceMs: number,
): ResolvedCommitComments[] {
  return resolved.filter((entry) => Math.abs(entry.atMs - runMs) <= toleranceMs)
}

/**
 * A comment message as one line of plain text, for tooltips and prompts. The
 * message is Portable Text: block children are joined, an inline mention
 * becomes "@mention" (the user's name needs a lookup the caller may not have),
 * blocks are separated by a space, and the result is collapsed and clipped.
 */
export function commentExcerpt(message: PortableTextBlock[] | null, maxLength = 90): string {
  return clip(messageToPlainText(message), maxLength)
}

export function messageToPlainText(message: PortableTextBlock[] | null): string {
  if (!message) return ''
  return message
    .map((block) => {
      const children = Array.isArray(block.children) ? block.children : []
      return children
        .map((child: {_type?: string; text?: unknown}) => {
          if (child._type === 'mention') return '@mention'
          return typeof child.text === 'string' ? child.text : ''
        })
        .join('')
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function clip(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}
