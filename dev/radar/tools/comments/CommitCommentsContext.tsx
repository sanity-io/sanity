import {createContext, type ReactNode, useContext, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, debounceTime, defer, map, of, startWith, switchMap} from 'rxjs'
import {useAddonDataset, useDocumentStore} from 'sanity'

import {COMMIT_COMMENTS_QUERY, type CommitComment, shaFromCommitDocumentId} from './comments'

/**
 * Every comment on a commit, for the surfaces that need the whole set at once:
 * the chart markers, the tooltip, the bisect timeline's count badges. The
 * studio's own comments provider loads one document's threads at a time (and
 * is what the panels mount to read and write them); this is the read-only
 * aggregate next to it.
 *
 * Context rather than props: the chart, the legend, the popover and the bisect
 * timeline all read it, and threading one array through five layers for a
 * value that never varies within a tool was the wrong trade. The default is
 * "no comments", so a chart rendered outside a provider (a story, a debug data
 * source) draws no markers.
 */
const CommitCommentsContext = createContext<CommitComment[]>([])

export function useCommitComments(): CommitComment[] {
  return useContext(CommitCommentsContext)
}

export function CommitCommentsProvider(props: {comments: CommitComment[]; children: ReactNode}) {
  const {comments, children} = props
  return (
    <CommitCommentsContext.Provider value={comments}>{children}</CommitCommentsContext.Provider>
  )
}

interface RawComment {
  _id: string
  threadId: string
  parentCommentId: string | null
  status: 'open' | 'resolved'
  authorId: string
  message: CommitComment['message']
  createdAt: string
  documentId: string
  seriesKey: string | null
}

interface CommitDate {
  _id: string
  committedAt: string | null
}

const GIT_COMMIT_DATES_QUERY = `*[_type == "gitCommit" && _id in $ids]{_id, committedAt}`

function toCommitComments(raw: RawComment[], dates: Map<string, string>): CommitComment[] {
  const comments: CommitComment[] = []
  for (const entry of raw) {
    const sha = shaFromCommitDocumentId(entry.documentId)
    // A comment on some other gitCommit-typed target (a malformed id) has no
    // place on the time axis — skip it rather than guess
    if (!sha) continue
    const committedAt = dates.get(entry.documentId)
    comments.push({
      _id: entry._id,
      sha,
      threadId: entry.threadId,
      parentCommentId: entry.parentCommentId,
      status: entry.status,
      authorId: entry.authorId,
      message: entry.message,
      createdAt: entry.createdAt,
      ...(entry.seriesKey ? {seriesKey: entry.seriesKey} : {}),
      ...(committedAt ? {committedAt} : {}),
    })
  }
  return comments
}

/**
 * Every comment on a `gitCommit`, realtime, with each commit's date joined in
 * from the bench dataset.
 *
 * Comments live in the workspace's comments addon dataset, which the studio's
 * `AddonDatasetProvider` (mounted by the default comments plugin) exposes as a
 * client — `null` until the dataset exists, i.e. until someone has left the
 * first comment anywhere in this studio. Realtime is a listen on the query
 * that re-runs the fetch on every mutation (the same shape the studio's own
 * comments store uses; the `welcome` event triggers the initial load), so a
 * thread left in another tab shows up here without a reload.
 *
 * The addon dataset cannot join to the bench dataset in GROQ, so the commit
 * dates come from a second, realtime query against `gitCommit` for exactly
 * the commented ids — the comments render first and the dates land a moment
 * later. Comments are annotation: any failure degrades to "no comments"
 * rather than an error card, the same choice the tag stream makes.
 */
export function useLiveCommitComments(): CommitComment[] {
  const {client} = useAddonDataset()
  const documentStore = useDocumentStore()
  const comments$ = useMemo(() => {
    if (!client) return of<CommitComment[]>([])
    const fetch$ = defer(() => client.observable.fetch<RawComment[]>(COMMIT_COMMENTS_QUERY))
    return client.observable
      .listen(
        COMMIT_COMMENTS_QUERY,
        {},
        {events: ['welcome', 'mutation', 'reconnect'], visibility: 'query', tag: 'radar.comments'},
      )
      .pipe(
        // A thread's mutations arrive in bursts (create, then the optimistic
        // patches); one refetch per burst is plenty for a marker layer
        debounceTime(250),
        switchMap(() => fetch$),
        catchError(() => fetch$.pipe(catchError(() => of<RawComment[]>([])))),
        switchMap((raw) => {
          const ids = [...new Set(raw.map((entry) => entry.documentId))]
          if (ids.length === 0) return of(toCommitComments(raw, new Map()))
          return documentStore
            .listenQuery(GIT_COMMIT_DATES_QUERY, {ids}, {tag: 'metrics.comments.commits'})
            .pipe(
              map((rows) => {
                const dates = new Map<string, string>()
                for (const row of rows as CommitDate[]) {
                  if (row.committedAt) dates.set(row._id, row.committedAt)
                }
                return dates
              }),
              catchError(() => of(new Map<string, string>())),
              // Render the comments before the dates resolve — the anchored
              // markers do not need them, and the rest land a beat later
              startWith(new Map<string, string>()),
              map((dates) => toCommitComments(raw, dates)),
            )
        }),
      )
  }, [client, documentStore])
  return useObservable(comments$, [])
}
