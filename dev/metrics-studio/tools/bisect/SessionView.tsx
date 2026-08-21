import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {Badge, Box, Button, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {type SanityClient, useDocumentStore} from 'sanity'

import {commitUrl, compareUrl} from '../trends/links'
import {
  type BisectCommit,
  buildChain,
  buildTimeline,
  chainErrorCopy,
  deriveBisectState,
  type Mark,
  releasesContaining,
  type Verdict,
} from './bisect'
import {BISECT_SESSION_QUERY, type SessionDocument, type TagSlice} from './data'
import {
  appendMark,
  clearResult,
  createSession,
  type ResultAnnotations,
  setResult,
  undoMark,
  updateResult,
} from './sessions'
import {pluralize} from './text'
import {Timeline} from './Timeline'

interface LiveState {
  session: SessionDocument | null | undefined
  error: string | null
}

/**
 * The stepper for one bisect session. All state is derived live from the
 * session's marks and the commit chain — `result` on the document is only
 * denormalized bookkeeping for the list view, written in the same patch as
 * the converging mark (and cleared by undo).
 */
export function SessionView(props: {
  sessionId: string
  commitsBySha: Map<string, BisectCommit>
  tags: TagSlice[]
  client: SanityClient
  userName: string
  onBack: () => void
  onOpenSession: (id: string) => void
}) {
  const {sessionId, commitsBySha, tags, client, userName, onBack, onOpenSession} = props
  const documentStore = useDocumentStore()
  const toast = useToast()

  const live$ = useMemo(
    () =>
      documentStore
        .listenQuery(BISECT_SESSION_QUERY, {id: sessionId}, {tag: 'metrics.bisect.session'})
        .pipe(
          map((result): LiveState => ({session: result as SessionDocument | null, error: null})),
          catchError((error: unknown) =>
            of<LiveState>({
              session: undefined,
              error: error instanceof Error ? error.message : String(error),
            }),
          ),
        ),
    [documentStore, sessionId],
  )
  const live = useObservable(live$, {session: undefined, error: null})
  const session = live.session

  const goodSha = session?.good?.sha
  const badSha = session?.bad?.sha
  const chainResult = useMemo(() => {
    if (!goodSha || !badSha || commitsBySha.size === 0) return null
    return buildChain(commitsBySha, goodSha, badSha)
  }, [commitsBySha, goodSha, badSha])

  const marks: (Mark & {_key: string})[] = useMemo(
    () =>
      (session?.marks ?? [])
        .filter(
          (mark) => mark.verdict === 'good' || mark.verdict === 'bad' || mark.verdict === 'skip',
        )
        .map((mark) => ({_key: mark._key, sha: mark.sha, verdict: mark.verdict as Verdict})),
    [session?.marks],
  )

  // Release tag lookup: sha → npm version ("v6.10.1" → "6.10.1")
  const versionBySha = useMemo(
    () => new Map(tags.map((tag) => [tag.sha, tag.tag.replace(/^v/, '')])),
    [tags],
  )
  const releasesOnly = Boolean(session?.releasesOnly)
  const bisectOptions = useMemo(
    () => (releasesOnly ? {candidateShas: new Set(versionBySha.keys())} : {}),
    [releasesOnly, versionBySha],
  )

  const state = useMemo(
    () => (chainResult?.ok ? deriveBisectState(chainResult.chain, marks, bisectOptions) : null),
    [chainResult, marks, bisectOptions],
  )

  const timeline = useMemo(
    () => (chainResult?.ok ? buildTimeline(chainResult.chain, marks, bisectOptions) : []),
    [chainResult, marks, bisectOptions],
  )

  // Releases containing the commit in focus — the one under test while
  // active, the culprit once converged
  const focusSha =
    state?.kind === 'converged'
      ? state.firstBad.sha
      : state?.kind === 'active'
        ? state.next.sha
        : undefined
  const releases = useMemo(
    () => (focusSha ? releasesContaining(commitsBySha, tags, focusSha) : []),
    [focusSha, commitsBySha, tags],
  )

  const onError = (title: string) => (err: unknown) =>
    toast.push({
      status: 'error',
      title,
      description: err instanceof Error ? err.message : String(err),
    })

  // Sessions can be converged FROM BIRTH (adjacent endpoints, a drill-down
  // over an untestable range) — no converging mark ever fires, so appendMark
  // never persists the verdict and the sessions list would show them as
  // forever-active. A deliberate effect-driven write, guarded on the document
  // lacking a result so the realtime echo terminates it; a concurrent
  // duplicate is an idempotent set.
  const hasStoredResult = Boolean(session?.result?.firstBadSha)
  useEffect(() => {
    if (!session || !state) return
    const fail = (title: string) => (err: unknown) =>
      toast.push({
        status: 'error',
        title,
        description: err instanceof Error ? err.message : String(err),
      })
    if (state.kind === 'converged' && !hasStoredResult) {
      void setResult(client, sessionId, {
        firstBadSha: state.firstBad.sha,
        lastGoodSha: state.lastGood.sha,
        suspectShas: state.suspects.map((suspect) => suspect.sha),
      }).catch(fail('Could not store the verdict'))
    } else if (state.kind === 'active' && hasStoredResult) {
      // Mirror image: a concurrent editor's contradicting mark can land a
      // stale verdict on the document while the live-derived state has
      // re-opened — clear it so the sessions list agrees with reality
      void clearResult(client, sessionId).catch(fail('Could not clear the stale verdict'))
    }
  }, [state, session, hasStoredResult, client, sessionId, toast])

  const mark = (sha: string, verdict: Verdict) => {
    if (!chainResult?.ok) return
    // Detect convergence with the new mark included, so the denormalized
    // result lands in the same patch as the mark that concluded the run —
    // and a non-converging mark clears any (now possibly stale) result
    const nextState = deriveBisectState(
      chainResult.chain,
      [...marks, {sha, verdict}],
      bisectOptions,
    )
    const result =
      nextState.kind === 'converged'
        ? {
            firstBadSha: nextState.firstBad.sha,
            lastGoodSha: nextState.lastGood.sha,
            suspectShas: nextState.suspects.map((suspect) => suspect.sha),
          }
        : undefined
    appendMark(client, sessionId, {sha, verdict, markedBy: userName}, result).catch(
      onError('Could not save mark'),
    )
  }

  const undo = () => {
    const last = marks.at(-1)
    if (last) undoMark(client, sessionId, last._key).catch(onError('Could not undo mark'))
  }

  // Drill-down from a releases-only verdict: a fresh commit-granular session
  // over exactly the suspect range
  const continueBisect = () => {
    if (state?.kind !== 'converged') return
    const label = (sha: string) => {
      const version = versionBySha.get(sha)
      return version ? {sha, label: `v${version}`} : {sha}
    }
    createSession(client, {
      good: label(state.lastGood.sha),
      bad: label(state.firstBad.sha),
      createdBy: userName,
    })
      .then(onOpenSession)
      .catch(onError('Could not create session'))
  }

  return (
    <Box padding={4} style={{overflowY: 'auto', height: '100%'}}>
      <Container width={2}>
        <Stack gap={4}>
          <Flex align="center" gap={3}>
            <Button mode="bleed" icon={ArrowLeftIcon} text="Sessions" onClick={onBack} />
            <Box flex={1}>
              <Text size={2} weight="semibold">
                {session?.title ?? 'Bisect session'}
              </Text>
            </Box>
          </Flex>

          {live.error && (
            <Card padding={4} radius={3} tone="critical">
              <Text size={1}>Failed to load session: {live.error}</Text>
            </Card>
          )}
          {!live.error && session === undefined && (
            <Text size={1} muted>
              Loading…
            </Text>
          )}
          {session === null && (
            <Card padding={4} radius={3} tone="caution">
              <Text size={1}>This session no longer exists.</Text>
            </Card>
          )}

          {session && chainResult && !chainResult.ok && (
            <Card padding={4} radius={3} tone="caution">
              <Text size={1}>
                {chainErrorCopy(
                  chainResult.reason,
                  session.good?.label ?? session.good?.sha?.slice(0, 7) ?? 'unknown',
                  session.bad?.label ?? session.bad?.sha?.slice(0, 7) ?? 'unknown',
                )}{' '}
                The session is kept as a record.
              </Text>
            </Card>
          )}

          {state?.kind === 'inconsistent' && (
            <Card padding={4} radius={3} tone="caution">
              <Text size={1}>
                Conflicting marks: <code>{state.goodMarkSha.slice(0, 10)}</code> is marked good but
                is newer than bad-marked <code>{state.badMarkSha.slice(0, 10)}</code>. Undo a mark
                to resolve.
              </Text>
            </Card>
          )}

          {state?.kind === 'active' && <RangeStatus state={state} releasesOnly={releasesOnly} />}
          {timeline.length > 0 && (
            <Timeline
              entries={timeline}
              onMark={mark}
              onUndo={marks.length > 0 ? undo : undefined}
              stepsLeft={state?.kind === 'active' ? state.stepsLeft : undefined}
              currentReleases={state?.kind === 'active' ? releases : []}
              versionBySha={versionBySha}
              converged={
                state?.kind === 'converged'
                  ? {
                      state,
                      releases,
                      annotations: {
                        regression: session?.result?.regression ?? undefined,
                        description: session?.result?.description ?? undefined,
                        linearIssue: session?.result?.linearIssue ?? undefined,
                      },
                      onAnnotate: (patch: ResultAnnotations) =>
                        updateResult(client, sessionId, patch).catch(
                          onError('Could not save annotation'),
                        ),
                      onContinue: releasesOnly ? continueBisect : undefined,
                    }
                  : undefined
              }
            />
          )}
        </Stack>
      </Container>
    </Box>
  )
}

/** Where the search stands — rendered as the timeline's preamble. */
function RangeStatus(props: {
  state: Extract<ReturnType<typeof deriveBisectState>, {kind: 'active'}>
  releasesOnly?: boolean
}) {
  const {state, releasesOnly} = props
  return (
    <Stack gap={3}>
      <Flex align="center" gap={2} wrap="wrap">
        <Text size={1} muted>
          The bad commit is between
        </Text>
        <Badge tone="positive" fontSize={0}>
          <a href={commitUrl(state.goodBound.sha)} target="_blank" rel="noreferrer">
            good {state.goodBound.sha.slice(0, 7)}
          </a>
        </Badge>
        <Text size={1} muted>
          and
        </Text>
        <Badge tone="critical" fontSize={0}>
          <a href={commitUrl(state.badBound.sha)} target="_blank" rel="noreferrer">
            bad {state.badBound.sha.slice(0, 7)}
          </a>
        </Badge>
        <Text size={1} muted>
          —{' '}
          <a
            href={compareUrl(state.goodBound.sha, state.badBound.sha)}
            target="_blank"
            rel="noreferrer"
          >
            {pluralize(state.unknownCount, 'commit')} in range
          </a>
          , about {pluralize(state.stepsLeft, 'commit')} left to test.
        </Text>
      </Flex>
      {releasesOnly ? (
        <Text size={1} muted>
          Bisecting released versions only — {pluralize(state.testableCount, 'release')} left to
          test in the range; the commits between releases are reported as suspects at the end.
        </Text>
      ) : (
        state.unknownCount > state.testableCount && (
          <Text size={1} muted>
            {state.unknownCount - state.testableCount} of these have no preview build (or were
            skipped) and can't be tested directly — if the range narrows down to them, they're
            reported as suspects.
          </Text>
        )
      )}
    </Stack>
  )
}
