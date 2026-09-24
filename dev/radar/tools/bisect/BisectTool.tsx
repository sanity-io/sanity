import {AddIcon} from '@sanity/icons/Add'
import {EnterRightIcon} from '@sanity/icons/EnterRight'
import {Badge, Box, Button, Card, Container, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type SVGProps, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useClient, useCurrentUser, useDocumentStore} from 'sanity'
import {Flex, VStack} from 'ui5'

import {compareTagsSemverDesc, regressionsByTag, withoutEolLines} from '../releases/releaseInfo'
import {RELEASE_LINES_QUERY, type ReleaseLineSlice} from '../releases/releaseLines'
import {commitUrl, prUrl} from '../trends/links'
import {useUrlState} from '../trends/useUrlState'
import {
  BISECT_COMMITS_QUERY,
  BISECT_SESSIONS_QUERY,
  BISECT_TAGS_QUERY,
  type GitCommitSlice,
  type SessionSummary,
  type TagSlice,
  toBisectCommit,
} from './data'
import {NewSessionDialog} from './NewSessionDialog'
import {RelativeDate} from './RelativeDate'
import {type ChainVerdict, mergeChainVerdict, resolveSessionChains} from './sessionChains'
import {createSession, type NewSessionInput} from './sessions'
import {SessionView} from './SessionView'
import {isSeverity, SEVERITY_LABEL, SEVERITY_TONE} from './severity'
import {pluralize} from './text'

interface LiveState<T> {
  data: T | null
  error: string | null
}

/**
 * Guided bisect over mainline history: pick a good and a bad commit, and the
 * tool walks you through which preview build (`gitCommit.testStudioUrl`) to
 * test next, halving the range on every good/bad verdict until the first bad
 * commit is named. Each run is a `bisectSession` document — this overview
 * lists them (verdict for concluded runs, progress for active ones) and the
 * stepper lives behind `?session=<id>`.
 */
export function BisectTool() {
  const documentStore = useDocumentStore()
  const client = useClient({apiVersion: '2025-02-19'})
  const currentUser = useCurrentUser()
  const toast = useToast()
  const [sessionId, setSessionId] = useUrlState('session', '')
  const [creating, setCreating] = useState(false)

  const commitsLive$ = useMemo(
    () =>
      documentStore.listenQuery(BISECT_COMMITS_QUERY, {}, {tag: 'metrics.bisect.commits'}).pipe(
        map((result): LiveState<GitCommitSlice[]> => ({
          data: result as GitCommitSlice[],
          error: null,
        })),
        catchError((error: unknown) =>
          of<LiveState<GitCommitSlice[]>>({
            data: null,
            error: error instanceof Error ? error.message : String(error),
          }),
        ),
      ),
    [documentStore],
  )
  const commitsLive = useObservable(commitsLive$, {data: null, error: null})

  const sessionsLive$ = useMemo(
    () =>
      documentStore.listenQuery(BISECT_SESSIONS_QUERY, {}, {tag: 'metrics.bisect.sessions'}).pipe(
        map((result): LiveState<SessionSummary[]> => ({
          data: result as SessionSummary[],
          error: null,
        })),
        catchError((error: unknown) =>
          of<LiveState<SessionSummary[]>>({
            data: null,
            error: error instanceof Error ? error.message : String(error),
          }),
        ),
      ),
    [documentStore],
  )
  const sessionsLive = useObservable(sessionsLive$, {data: null, error: null})

  const tagsLive$ = useMemo(
    () =>
      documentStore.listenQuery(BISECT_TAGS_QUERY, {}, {tag: 'metrics.bisect.tags'}).pipe(
        map((result): LiveState<TagSlice[]> => ({data: result as TagSlice[], error: null})),
        catchError((error: unknown) =>
          of<LiveState<TagSlice[]>>({
            data: null,
            error: error instanceof Error ? error.message : String(error),
          }),
        ),
      ),
    [documentStore],
  )
  const tagsLive = useObservable(tagsLive$, {data: null, error: null})

  const linesLive$ = useMemo(
    () =>
      documentStore.listenQuery(RELEASE_LINES_QUERY, {}, {tag: 'metrics.bisect.lines'}).pipe(
        map((result): LiveState<ReleaseLineSlice[]> => ({
          data: result as ReleaseLineSlice[],
          error: null,
        })),
        catchError((error: unknown) =>
          of<LiveState<ReleaseLineSlice[]>>({
            data: null,
            error: error instanceof Error ? error.message : String(error),
          }),
        ),
      ),
    [documentStore],
  )
  const linesLive = useObservable(linesLive$, {data: null, error: null})
  // Endpoints on offer: releases of end-of-life lines are not among them.
  // The session view keeps the full list — attribution and the releases-only
  // candidate set must see every release
  const activeTags = useMemo(
    () =>
      withoutEolLines(
        tagsLive.data ?? [],
        new Set((linesLive.data ?? []).map((line) => line.major)),
      ),
    [tagsLive.data, linesLive.data],
  )

  const commitsBySha = useMemo(
    () => new Map((commitsLive.data ?? []).map((slice) => [slice.sha, toBisectCommit(slice)])),
    [commitsLive.data],
  )

  // The releases each verdict was live in — from the one that first shipped
  // the commit to the last one before the fix (every later release when
  // unfixed). That is what a regression "is", to a reader; the range that
  // was searched is a detail. The fix release is the chain's, so a parent
  // shows the same end as the refinement that recorded it
  // The chain's merged verdict and membership, keyed by every member: a
  // chain is one regression, so the root row shows the union of it — the
  // worst severity rated anywhere, the fix release, the widest release range
  const chainBySession = useMemo(() => {
    const map = new Map<string, ChainVerdict & {memberIds: string[]}>()
    for (const chain of resolveSessionChains(sessionsLive.data ?? [])) {
      const verdict = {
        ...mergeChainVerdict(chain),
        memberIds: chain.sessions.map((member) => member._id),
      }
      for (const member of chain.sessions) map.set(member._id, verdict)
    }
    return map
  }, [sessionsLive.data])
  const activeRangeBySession = useMemo(() => {
    const tags = tagsLive.data ?? []
    const sessions = sessionsLive.data ?? []
    const map = new Map<string, ActiveRange>()
    for (const session of sessions) {
      const sha = session.result?.firstBadSha
      if (!sha) continue
      const fixedIn =
        chainBySession.get(session._id)?.fixedIn ?? session.result?.fixedIn ?? undefined
      const spans = regressionsByTag(commitsBySha, tags, [{firstBadSha: sha, fixedIn}])
      const affected = [...spans]
        .filter(([, span]) => span.introduced.length + span.inherited.length > 0)
        .map(([tag]) => tag)
        .toSorted(compareTagsSemverDesc)
      if (affected.length === 0) continue
      map.set(session._id, {from: affected.at(-1)!, to: affected[0], fixedIn})
    }
    return map
  }, [sessionsLive.data, tagsLive.data, commitsBySha, chainBySession])
  // The union of a chain's ranges: earliest start to latest end
  const chainRangeBySession = useMemo(() => {
    const map = new Map<string, ActiveRange>()
    for (const [id, chain] of chainBySession) {
      const ranges = chain.memberIds.flatMap((member) => activeRangeBySession.get(member) ?? [])
      if (ranges.length === 0) continue
      const from = ranges
        .map((range) => range.from)
        .toSorted(compareTagsSemverDesc)
        .at(-1)!
      const to = ranges.map((range) => range.to).toSorted(compareTagsSemverDesc)[0]
      map.set(id, {from, to, fixedIn: chain.fixedIn})
    }
    return map
  }, [chainBySession, activeRangeBySession])

  const userName = currentUser?.name ?? currentUser?.email ?? 'unknown'

  // Async so the dialog can disable its submit until it settles
  const handleCreate = async (input: NewSessionInput) => {
    try {
      const id = await createSession(client, input)
      setCreating(false)
      setSessionId(id, 'push')
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Could not create bisect session',
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }

  if (sessionId) {
    return (
      <SessionView
        sessionId={sessionId}
        commitsBySha={commitsBySha}
        tags={tagsLive.data}
        dataError={commitsLive.error ?? tagsLive.error}
        client={client}
        userName={userName}
        onBack={() => setSessionId('', 'push')}
        onOpenSession={(id) => setSessionId(id, 'push')}
      />
    )
  }

  const error = commitsLive.error ?? sessionsLive.error ?? tagsLive.error
  const sessions = sessionsLive.data
  // Refinements nest under the session they narrow down (every one of them,
  // abandoned branches included — the list is the full record; which branch
  // counts as the regression is sessionChains.ts' business). Roots keep the
  // query's newest-first order; refinements read oldest first, as the story
  // unfolded. A refinement whose parent is gone is a root again.
  const sessionIds = new Set((sessions ?? []).map((session) => session._id))
  const roots: SessionSummary[] = []
  const childrenOf = new Map<string, SessionSummary[]>()
  for (const session of sessions ?? []) {
    const parent = session.refines
    if (parent && parent !== session._id && sessionIds.has(parent)) {
      childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), session])
    } else {
      roots.push(session)
    }
  }
  for (const children of childrenOf.values()) {
    children.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
  }

  return (
    <Box padding={4} style={{overflowY: 'auto', height: '100%'}}>
      <Container width={2}>
        <VStack gap={4}>
          <Flex alignItems="center" gap={3}>
            <Box flex={1}>
              <VStack gap={3}>
                <Text size={3} weight="semibold">
                  Bisect
                </Text>
                <Text size={1} muted>
                  Hunt down the commit that broke something: pick a known-good and a known-bad
                  commit, then test the preview build the tool proposes at each step. Every run is
                  stored as a session, so a bisect can be shared or picked up later.
                </Text>
              </VStack>
            </Box>
            <Button
              icon={AddIcon}
              text="Start bisect"
              tone="primary"
              disabled={!commitsLive.data}
              onClick={() => setCreating(true)}
            />
          </Flex>

          {error && (
            <Card padding={4} radius={3} tone="critical">
              <Text size={1}>Failed to load: {error}</Text>
            </Card>
          )}
          {!error && sessions === null && (
            <Text size={1} muted>
              Loading…
            </Text>
          )}
          {sessions?.length === 0 && (
            <Card padding={4} radius={3} tone="transparent" border>
              <Text size={1} muted>
                No bisect sessions yet.
              </Text>
            </Card>
          )}

          {roots.map((session) => (
            <SessionTree
              key={session._id}
              session={session}
              childrenOf={childrenOf}
              activeRangeBySession={chainRangeBySession}
              chainBySession={chainBySession}
              onOpen={(id) => setSessionId(id, 'push')}
            />
          ))}
        </VStack>
      </Container>

      {creating && (
        <NewSessionDialog
          commits={commitsLive.data ?? []}
          tags={activeTags}
          commitsBySha={commitsBySha}
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
          createdBy={userName}
        />
      )}
    </Box>
  )
}

/**
 * One regression as one box, like a release on the Releases page: the root
 * session and, indented under it, the sessions that narrow it down —
 * recursively, since a refinement can be refined again. Only the outer box
 * has a border; the rows inside are plain click targets, so the box reads as
 * the unit and the indent as "refines". The visited set guards against a
 * reference cycle in hand-edited data.
 */
function SessionTree(props: {
  session: SessionSummary
  childrenOf: Map<string, SessionSummary[]>
  activeRangeBySession: Map<string, ActiveRange>
  chainBySession: Map<string, ChainVerdict>
  onOpen: (id: string) => void
  visited?: ReadonlySet<string>
  depth?: number
}) {
  const {
    session,
    childrenOf,
    activeRangeBySession,
    chainBySession,
    onOpen,
    visited = new Set(),
    depth = 0,
  } = props
  const children = (childrenOf.get(session._id) ?? []).filter((child) => !visited.has(child._id))
  const nextVisited = new Set(visited).add(session._id)
  const body = (
    <VStack gap={1}>
      <SessionRow
        session={session}
        // The status line (affected releases, outcome, severity) is the
        // union of the chain's, shown once, on the root row of the box
        status={
          depth === 0
            ? {range: activeRangeBySession.get(session._id), chain: chainBySession.get(session._id)}
            : undefined
        }
        refinementCount={children.length}
        onOpen={() => onOpen(session._id)}
      />
      {children.length > 0 && (
        <Box paddingLeft={3}>
          <VStack gap={1}>
            {children.map((child) => (
              // A "down and right" arrow in the gutter, level with the child's
              // heading, says "narrows down the one above" without words
              <Flex key={child._id} alignItems="flex-start" gap={1}>
                <Box paddingTop={3} style={{flexShrink: 0}}>
                  <Text size={1} muted>
                    <EnterRightIcon />
                  </Text>
                </Box>
                <Box flex={1} style={{minWidth: 0}}>
                  <SessionTree
                    session={child}
                    childrenOf={childrenOf}
                    activeRangeBySession={activeRangeBySession}
                    chainBySession={chainBySession}
                    onOpen={onOpen}
                    visited={nextVisited}
                    depth={depth + 1}
                  />
                </Box>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  )
  return depth === 0 ? (
    <Card padding={1} radius={3} border>
      {body}
    </Card>
  ) : (
    body
  )
}

interface ActiveRange {
  /** The release that first shipped the regression. */
  from: string
  /** The last release still carrying it — the newest synced one when unfixed. */
  to: string
  fixedIn?: string
}

function SessionRow(props: {
  session: SessionSummary
  /**
   * The chain's status — the releases the regression was live in (when the
   * verdict maps onto synced releases) and the merged verdict. Absent on
   * nested rows: one regression, one status line, on the root.
   */
  status: {range: ActiveRange | undefined; chain: ChainVerdict | undefined} | undefined
  /** How many sessions narrow this one down — they are listed right under it. */
  refinementCount: number
  onOpen: () => void
}) {
  const {session, status, refinementCount, onOpen} = props
  const activeRange = status?.range
  const concluded = Boolean(session.result?.firstBadSha)
  const description = session.description
  const note = session.result?.note
  // The heading is what the session is about: the issue when written, else
  // the verdict note. The range that was bisected is deliberately not shown
  // in this overview at all — it is how the answer was found, not the
  // answer; the session view has it. The releases the regression was live
  // in get a line of their own below the heading
  const heading = description || note || (concluded ? 'Concluded bisect' : 'Bisect in progress')
  // The severity, when rated, sits on the status line with the affected
  // releases; an unrated regression carries no badge — the verdict on the
  // right already says what was found
  const severity = status?.chain?.regression ? status.chain.severity : undefined
  const firstBadSha = session.result?.firstBadSha ?? undefined
  // The subject usually ends in "(#1234)"; when the PR is known, that tail
  // becomes the link instead of being repeated
  const prNumber = session.resultPrNumber ?? undefined
  const subject =
    prNumber === undefined
      ? session.resultSubject
      : session.resultSubject?.replace(new RegExp(`\\s*\\(#${prNumber}\\)$`), '')

  // The whole row opens the session; the links inside go elsewhere, so they
  // stop the click from reaching the row. The heading is a real link to the
  // session (keyboard and middle-click), the row's onClick is the mouse
  // convenience around it
  const stop = (event: {stopPropagation: () => void}) => event.stopPropagation()
  return (
    <Card padding={3} radius={2} onClick={onOpen} style={{cursor: 'pointer'}}>
      <Flex alignItems="center" gap={3} flexWrap="wrap">
        <Box flex={1} style={{minWidth: 0}}>
          <VStack gap={2}>
            {/* The heading (see above), then the verdict note: what and why */}
            <Flex alignItems="center" gap={2}>
              <Box flex={1} style={{minWidth: 0}}>
                <Text size={1} weight="medium" textOverflow="ellipsis">
                  <a
                    href={`?session=${encodeURIComponent(session._id)}`}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      onOpen()
                    }}
                    style={{color: 'inherit', textDecoration: 'none'}}
                  >
                    {heading}
                  </a>
                </Text>
              </Box>
            </Flex>
            {description && note && (
              <Text size={1} muted textOverflow="ellipsis">
                {note}
              </Text>
            )}
            {/* The status line: the releases it was live in, as version
                badges like the Releases page uses, how it ended, how bad */}
            {(activeRange || severity) && (
              <Flex alignItems="center" gap={2} flexWrap="wrap">
                {activeRange && (
                  <>
                    <Text size={1} muted>
                      Affected
                    </Text>
                    <Badge tone="primary" fontSize={0}>
                      {activeRange.from}
                    </Badge>
                    {activeRange.to !== activeRange.from && (
                      <>
                        <Text size={1} muted>
                          –
                        </Text>
                        <Badge tone="primary" fontSize={0}>
                          {activeRange.to}
                        </Badge>
                      </>
                    )}
                    {activeRange.fixedIn ? (
                      <Badge tone="positive" fontSize={0}>
                        fixed in {activeRange.fixedIn}
                      </Badge>
                    ) : (
                      <Badge tone="caution" fontSize={0}>
                        not fixed yet
                      </Badge>
                    )}
                  </>
                )}
                {severity && (
                  <Badge tone={SEVERITY_TONE[severity]} fontSize={0}>
                    {SEVERITY_LABEL[severity]}
                  </Badge>
                )}
              </Flex>
            )}
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              {session.createdAt && <RelativeDate dateTime={session.createdAt} size={0} muted />}
              <Text size={0} muted>
                · {session.createdBy}
              </Text>
              {refinementCount > 0 && (
                <Text size={0} muted>
                  · narrowed down by the {pluralize(refinementCount, 'session')} below — counted as
                  one regression
                </Text>
              )}
            </Flex>
          </VStack>
        </Box>
        {concluded && firstBadSha ? (
          // The verdict as a commit line: label above, then merge glyph,
          // sha, subject (both to the commit) and the PR — the same pieces
          // CommitCard shows, folded onto one line
          <Box style={{maxWidth: '50%', minWidth: 0}}>
            <VStack gap={2}>
              <Text size={0} muted>
                Identified
              </Text>
              <Card padding={2} radius={2} border tone="transparent">
                <Flex alignItems="center" gap={2}>
                  <Text size={1} muted>
                    <GitMergeIcon />
                  </Text>
                  <Text size={1}>
                    <a
                      href={commitUrl(firstBadSha)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open the commit on GitHub"
                      onClick={stop}
                    >
                      <code>{firstBadSha.slice(0, 10)}</code>
                    </a>
                  </Text>
                  {subject && (
                    <Box flex={1} style={{minWidth: 0}}>
                      <Text size={1} textOverflow="ellipsis">
                        <a
                          href={commitUrl(firstBadSha)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={stop}
                          style={{color: 'inherit', textDecoration: 'none'}}
                        >
                          {subject}
                        </a>
                      </Text>
                    </Box>
                  )}
                  {prNumber !== undefined && (
                    <Text size={1}>
                      <a
                        href={prUrl(prNumber)}
                        target="_blank"
                        rel="noreferrer"
                        title="Open the pull request on GitHub"
                        onClick={stop}
                      >
                        #{prNumber}
                      </a>
                    </Text>
                  )}
                </Flex>
              </Card>
            </VStack>
          </Box>
        ) : (
          <Badge tone="caution" fontSize={0}>
            {pluralize(session.markCount ?? 0, 'mark')}
          </Badge>
        )}
      </Flex>
    </Card>
  )
}

/**
 * A git-merge glyph in currentColor — two commits on a branch and the one
 * they merge into. @sanity/icons has no merge icon; drawn in its 25-unit box
 * with the same ~4 units of inset so it sits level with its neighbours.
 */
function GitMergeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 25 25" width="1em" height="1em" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        <path d="M8 8v9" />
        <path d="M8 8c0 4.5 4 5.5 9 5.5" />
      </g>
      <g fill="currentColor">
        <circle cx={8} cy={6} r={2} />
        <circle cx={8} cy={19} r={2} />
        <circle cx={19} cy={13.5} r={2} />
      </g>
    </svg>
  )
}
