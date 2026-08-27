import {AddIcon} from '@sanity/icons/Add'
import {Badge, Box, Button, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useClient, useCurrentUser, useDocumentStore} from 'sanity'

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
import {createSession, type NewSessionInput} from './sessions'
import {SessionView} from './SessionView'
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

  const commitsBySha = useMemo(
    () => new Map((commitsLive.data ?? []).map((slice) => [slice.sha, toBisectCommit(slice)])),
    [commitsLive.data],
  )

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

  return (
    <Box padding={4} style={{overflowY: 'auto', height: '100%'}}>
      <Container width={2}>
        <Stack gap={4}>
          <Flex align="center" gap={3}>
            <Box flex={1}>
              <Stack gap={3}>
                <Text size={3} weight="semibold">
                  Bisect
                </Text>
                <Text size={1} muted>
                  Hunt down the commit that broke something: pick a known-good and a known-bad
                  commit, then test the preview build the tool proposes at each step. Every run is
                  stored as a session, so a bisect can be shared or picked up later.
                </Text>
              </Stack>
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

          {sessions?.map((session) => (
            <SessionRow
              key={session._id}
              session={session}
              onOpen={() => setSessionId(session._id, 'push')}
            />
          ))}
        </Stack>
      </Container>

      {creating && (
        <NewSessionDialog
          commits={commitsLive.data ?? []}
          tags={tagsLive.data ?? []}
          commitsBySha={commitsBySha}
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
          createdBy={userName}
        />
      )}
    </Box>
  )
}

function SessionRow(props: {session: SessionSummary; onOpen: () => void}) {
  const {session, onOpen} = props
  const concluded = Boolean(session.result?.firstBadSha)

  return (
    <Card as="button" padding={4} radius={3} border onClick={onOpen} style={{textAlign: 'left'}}>
      <Flex align="center" gap={3} wrap="wrap">
        <Box flex={1}>
          <Stack gap={2}>
            <Text size={1} weight="medium">
              {session.title ?? session._id}
            </Text>
            <Flex align="center" gap={2}>
              {session.createdAt && <RelativeDate dateTime={session.createdAt} size={0} muted />}
              <Text size={0} muted>
                · {session.createdBy}
              </Text>
            </Flex>
          </Stack>
        </Box>
        {concluded ? (
          <Badge tone={session.result?.regression ? 'critical' : 'positive'} fontSize={0}>
            {session.result?.regression ? 'regression' : 'found'}{' '}
            {session.result?.firstBadSha?.slice(0, 10)}
            {session.resultSubject ? ` — ${session.resultSubject}` : ''}
          </Badge>
        ) : (
          <Badge tone="caution" fontSize={0}>
            {pluralize(session.markCount ?? 0, 'mark')}
          </Badge>
        )}
      </Flex>
    </Card>
  )
}
