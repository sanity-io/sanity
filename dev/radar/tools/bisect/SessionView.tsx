import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {TrashIcon} from '@sanity/icons/Trash'
import {Badge, Box, Button, Card, Container, Dialog, Stack, Text} from '@sanity/ui'
import {type ToastContextValue, useToast} from '@sanity/ui/toast'
import {useEffect, useMemo, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {type SanityClient, useDocumentStore} from 'sanity'
import {Flex} from 'ui5'

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
  createSession,
  deleteSession,
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

/** Error-toast curry, hoisted so the persist effect and the handlers share it. */
function toastError(toast: ToastContextValue, title: string) {
  return (err: unknown) =>
    toast.push({
      status: 'error',
      title,
      description: err instanceof Error ? err.message : String(err),
    })
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
  /** `null` while the tags query is loading (or after it errored) — the
   * distinction matters: releases-only sessions derive their candidate set
   * from the tags, and an empty set would spuriously converge. */
  tags: TagSlice[] | null
  /** Commits/tags query failure, surfaced here since both feed this view. */
  dataError?: string | null
  client: SanityClient
  userName: string
  onBack: () => void
  onOpenSession: (id: string) => void
}) {
  const {sessionId, commitsBySha, tags, dataError, client, userName, onBack, onOpenSession} = props
  const documentStore = useDocumentStore()
  const toast = useToast()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    () => new Map((tags ?? []).map((tag) => [tag.sha, tag.tag.replace(/^v/, '')])),
    [tags],
  )
  const releasesOnly = Boolean(session?.releasesOnly)
  // `null` = can't derive yet: a releases-only session must wait for the tags
  // to load. An empty candidate set is NOT "unrestricted" to the engine — it
  // is "nothing testable", which would derive a spurious `converged` and the
  // persist effect below would write a false verdict onto the document.
  const bisectOptions = useMemo(
    () => (releasesOnly ? (tags ? {candidateShas: new Set(versionBySha.keys())} : null) : {}),
    [releasesOnly, tags, versionBySha],
  )

  const state = useMemo(
    () =>
      chainResult?.ok && bisectOptions
        ? deriveBisectState(chainResult.chain, marks, bisectOptions)
        : null,
    [chainResult, marks, bisectOptions],
  )

  const timeline = useMemo(
    () =>
      chainResult?.ok && bisectOptions
        ? buildTimeline(chainResult.chain, marks, bisectOptions)
        : [],
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
    () => (focusSha ? releasesContaining(commitsBySha, tags ?? [], focusSha) : []),
    [focusSha, commitsBySha, tags],
  )

  const onError = (title: string) => toastError(toast, title)

  // Sessions can be converged FROM BIRTH (adjacent endpoints, a drill-down
  // over an untestable range) — no converging mark ever fires, so appendMark
  // never persists the verdict and the sessions list would show them as
  // forever-active. A deliberate effect-driven write, guarded on the document
  // lacking a result so the realtime echo terminates it; a concurrent
  // duplicate is an idempotent set.
  // Deliberately NO mirror-image auto-clear when the derived state is active
  // while a result is stored. Marks are the source of truth and every mark
  // patch already keeps `result` in sync atomically (appendMark sets or
  // unsets it, undoMark unsets it), so a contradicting concurrent mark never
  // leaves a stale verdict. The only other way the two can disagree is the
  // dataset catching up — a suspect's `testStudioUrl` lands one sync late and
  // becomes testable — and there the concluded verdict (with its annotations
  // and regression pin) must stand until a human's mark says otherwise.
  const hasStoredResult = Boolean(session?.result?.firstBadSha)
  useEffect(() => {
    if (!session || !state) return
    if (state.kind === 'converged' && !hasStoredResult) {
      void setResult(client, sessionId, {
        firstBadSha: state.firstBad.sha,
        lastGoodSha: state.lastGood.sha,
        suspectShas: state.suspects.map((suspect) => suspect.sha),
      }).catch(toastError(toast, 'Could not store the verdict'))
    }
  }, [state, session, hasStoredResult, client, sessionId, toast])

  const mark = (sha: string, verdict: Verdict) => {
    if (!chainResult?.ok || !bisectOptions) return
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

  // On failure the confirm dialog stays open, so the toast lands next to a
  // retryable Delete button
  const removeSession = () => {
    setDeleting(true)
    deleteSession(client, sessionId)
      .then(() => {
        setConfirmingDelete(false)
        onBack()
      })
      .catch((err: unknown) => {
        setDeleting(false)
        onError('Could not delete session')(err)
      })
  }

  // Drill-down from a releases-only verdict: a fresh commit-granular session
  // over exactly the suspect range. Ref-guarded rather than disabling the
  // (deeply nested) button: a repeat click during the round-trip would
  // otherwise create a duplicate session.
  const continuePending = useRef(false)
  const continueBisect = () => {
    if (state?.kind !== 'converged' || continuePending.current) return
    continuePending.current = true
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
      .finally(() => {
        continuePending.current = false
      })
  }

  return (
    <Box padding={4} style={{overflowY: 'auto', height: '100%'}}>
      <Container width={2}>
        <Stack gap={4}>
          <Flex alignItems="center" gap={3}>
            <Button mode="bleed" icon={ArrowLeftIcon} text="Sessions" onClick={onBack} />
            <Box flex={1}>
              <Text size={2} weight="semibold">
                {session?.title ?? 'Bisect session'}
              </Text>
            </Box>
            {session && (
              <Button
                mode="bleed"
                tone="critical"
                icon={TrashIcon}
                text="Delete session"
                onClick={() => setConfirmingDelete(true)}
              />
            )}
          </Flex>

          {dataError && (
            <Card padding={4} radius={3} tone="critical">
              <Text size={1}>Failed to load: {dataError}</Text>
            </Card>
          )}
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
          {session && !dataError && !chainResult && (
            <Text size={1} muted>
              Loading commit history…
            </Text>
          )}
          {session && !dataError && chainResult?.ok && !bisectOptions && (
            <Text size={1} muted>
              Loading release tags…
            </Text>
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
              {/* The timeline (and its undo control) doesn't render for an
                  inconsistent session, so the resolution the copy asks for has
                  to be offered right here. Undo peels the newest mark; repeat
                  until the conflicting one is gone. */}
              <Flex alignItems="center" gap={3}>
                <Box flex={1}>
                  <Text size={1}>
                    Conflicting marks: <code>{state.goodMarkSha.slice(0, 10)}</code> is marked good
                    but is newer than bad-marked <code>{state.badMarkSha.slice(0, 10)}</code>. Undo
                    a mark to resolve.
                  </Text>
                </Box>
                {marks.length > 0 && (
                  <Button mode="ghost" fontSize={1} text="Undo last mark" onClick={undo} />
                )}
              </Flex>
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
                      releasesOnly,
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

      {confirmingDelete && (
        <Dialog
          id="bisect-delete-session"
          header="Delete session"
          width={0}
          onClose={() => setConfirmingDelete(false)}
        >
          <Box padding={4}>
            <Stack gap={4}>
              <Text size={1}>
                Delete “{session?.title ?? sessionId}”? The session, its marks log, and any verdict
                (including a regression pinned on a release) are permanently removed.
              </Text>
              <Flex gap={2} justifyContent="flex-end">
                <Button mode="ghost" text="Cancel" onClick={() => setConfirmingDelete(false)} />
                <Button
                  tone="critical"
                  text={deleting ? 'Deleting…' : 'Delete'}
                  disabled={deleting}
                  onClick={removeSession}
                />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
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
      <Flex alignItems="center" gap={2} flexWrap="wrap">
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
