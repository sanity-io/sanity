import {AddIcon} from '@sanity/icons/Add'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Box, Button, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useClient, useCurrentUser, useDocumentStore} from 'sanity'
import {useIntentLink} from 'sanity/router'

import {
  BISECT_COMMITS_QUERY,
  BISECT_SESSIONS_QUERY,
  BISECT_TAGS_QUERY,
  type GitCommitSlice,
  type SessionSummary,
  type TagSlice,
  toBisectCommit,
} from '../bisect/data'
import {RelativeDate} from '../bisect/RelativeDate'
import {type ManualRegressionInput, reportRegression} from '../bisect/sessions'
import {pluralize} from '../bisect/text'
import {releaseUrl} from '../trends/links'
import {AddRegressionDialog} from './AddRegressionDialog'
import {baseVersionOf, changelogUrl, npmxUrl, regressionCountByTag} from './releaseInfo'

interface LiveState<T> {
  data: T | null
  error: string | null
}

/**
 * Every release, newest first: when it shipped (npm publish time when known),
 * which dist-tags point at it, weekly downloads, links out (Vercel preview
 * build of dev/test-studio at the tagged commit, GitHub release, sanity.io
 * changelog, npmx.dev), and how many confirmed regressions bisect sessions
 * have attributed to it (blamed on the INTRODUCING release). The
 * changelog link needs the release's base version — the previous release on
 * the first-parent chain — so off-mainline releases (maintenance lines) may
 * lack it. Regressions found outside a bisect are added by hand via
 * AddRegressionDialog, stored as born-converged bisect sessions.
 */
export function ReleasesTool() {
  const documentStore = useDocumentStore()
  const client = useClient({apiVersion: '2025-02-19'})
  const currentUser = useCurrentUser()
  const toast = useToast()
  const [addingRegression, setAddingRegression] = useState(false)

  const tagsLive = useObservable(
    useMemo(
      () =>
        documentStore.listenQuery(BISECT_TAGS_QUERY, {}, {tag: 'metrics.releases.tags'}).pipe(
          map((result): LiveState<TagSlice[]> => ({data: result as TagSlice[], error: null})),
          catchError((error: unknown) =>
            of<LiveState<TagSlice[]>>({
              data: null,
              error: error instanceof Error ? error.message : String(error),
            }),
          ),
        ),
      [documentStore],
    ),
    {data: null, error: null},
  )

  const commitsLive = useObservable(
    useMemo(
      () =>
        documentStore.listenQuery(BISECT_COMMITS_QUERY, {}, {tag: 'metrics.releases.commits'}).pipe(
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
    ),
    {data: null, error: null},
  )

  const sessionsLive = useObservable(
    useMemo(
      () =>
        documentStore
          .listenQuery(BISECT_SESSIONS_QUERY, {}, {tag: 'metrics.releases.sessions'})
          .pipe(
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
    ),
    {data: null, error: null},
  )

  const commitsBySha = useMemo(
    () => new Map((commitsLive.data ?? []).map((slice) => [slice.sha, toBisectCommit(slice)])),
    [commitsLive.data],
  )
  const tags = useMemo(() => tagsLive.data ?? [], [tagsLive.data])
  const tagBySha = useMemo(() => new Map(tags.map((tag) => [tag.sha, tag.tag])), [tags])

  // Per-release base version (an O(chain) ancestry walk) — precomputed once
  // instead of per row per render across three live queries
  const baseVersions = useMemo(
    () => new Map(tags.map((tag) => [tag.tag, baseVersionOf(commitsBySha, tagBySha, tag)])),
    [tags, commitsBySha, tagBySha],
  )

  const regressionCounts = useMemo(() => {
    const firstBadShas = (sessionsLive.data ?? [])
      .filter((session) => session.result?.regression && session.result.firstBadSha)
      .map((session) => session.result!.firstBadSha!)
    return regressionCountByTag(commitsBySha, tags, firstBadShas)
  }, [sessionsLive.data, commitsBySha, tags])

  const error = tagsLive.error ?? commitsLive.error ?? sessionsLive.error

  const userName = currentUser?.name ?? currentUser?.email ?? 'unknown'
  // Async so the dialog can disable its submit until it settles
  const handleAddRegression = async (input: ManualRegressionInput) => {
    try {
      await reportRegression(client, input)
      setAddingRegression(false)
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Could not add the regression',
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <Box padding={4} style={{overflowY: 'auto', height: '100%'}}>
      <Container width={2}>
        <Stack gap={4}>
          <Flex align="center" gap={3}>
            <Box flex={1}>
              <Stack gap={3}>
                <Text size={3} weight="semibold">
                  Studio releases
                </Text>
                <Text size={1} muted>
                  Every synced release tag with its npm state and the regressions bisect sessions
                  have pinned on it (blamed on the release that first shipped the offending commit).
                </Text>
              </Stack>
            </Box>
            <Button
              icon={AddIcon}
              text="Add regression"
              mode="ghost"
              disabled={!tagsLive.data || !commitsLive.data}
              onClick={() => setAddingRegression(true)}
            />
          </Flex>

          {error && (
            <Card padding={4} radius={3} tone="critical">
              <Text size={1}>Failed to load: {error}</Text>
            </Card>
          )}
          {!error && tagsLive.data === null && (
            <Text size={1} muted>
              Loading…
            </Text>
          )}
          {tagsLive.data?.length === 0 && (
            <Card padding={4} radius={3} tone="transparent" border>
              <Text size={1} muted>
                No releases synced yet — the sync-git-metrics workflow populates these.
              </Text>
            </Card>
          )}

          {tags.map((tag) => (
            <ReleaseRow
              key={tag._id}
              tag={tag}
              baseVersion={baseVersions.get(tag.tag)}
              regressions={regressionCounts.get(tag.tag) ?? 0}
              previewUrl={commitsBySha.get(tag.sha)?.testStudioUrl}
            />
          ))}
        </Stack>
      </Container>

      {addingRegression && (
        <AddRegressionDialog
          tags={tags}
          commitsBySha={commitsBySha}
          createdBy={userName}
          onClose={() => setAddingRegression(false)}
          onCreate={handleAddRegression}
        />
      )}
    </Box>
  )
}

function ReleaseRow(props: {
  tag: TagSlice
  baseVersion: string | undefined
  regressions: number
  previewUrl: string | undefined
}) {
  const {tag, baseVersion, regressions, previewUrl} = props
  const version = tag.tag.replace(/^v/, '')
  // The version opens the gitTag document in the structure tool — the raw
  // synced record behind the row
  const documentLink = useIntentLink({intent: 'edit', params: {id: tag._id, type: 'gitTag'}})

  return (
    <Card padding={3} radius={2} border>
      <Flex align="center" gap={3} wrap="wrap">
        <Box style={{width: 110, flexShrink: 0}}>
          <Text size={2} weight="medium">
            <a href={documentLink.href} onClick={documentLink.onClick}>
              {tag.tag}
            </a>
          </Text>
        </Box>
        {tag.npm?.distTags?.map((distTag) => (
          <Badge key={distTag} tone="primary" fontSize={0}>
            {distTag}
          </Badge>
        ))}
        {regressions > 0 && (
          <Badge tone="critical" fontSize={0}>
            {pluralize(regressions, 'regression')}
          </Badge>
        )}
        <Box flex={1} />
        {typeof tag.npm?.weeklyDownloads === 'number' && (
          <Text size={0} muted>
            {tag.npm.weeklyDownloads.toLocaleString('en-US')}/wk
          </Text>
        )}
        <RelativeDate dateTime={tag.npm?.publishedAt ?? tag.taggedAt} size={0} muted />
        <Flex gap={3}>
          {previewUrl && (
            <Text size={1}>
              <a href={previewUrl} target="_blank" rel="noreferrer">
                Preview
              </a>
            </Text>
          )}
          <Text size={1}>
            <a href={releaseUrl(tag.tag)} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </Text>
          {baseVersion && (
            <Text size={1}>
              <a href={changelogUrl(baseVersion)} target="_blank" rel="noreferrer">
                Changelog
              </a>
            </Text>
          )}
          <Text size={1}>
            <a href={npmxUrl(version)} target="_blank" rel="noreferrer">
              npmx <LaunchIcon />
            </a>
          </Text>
        </Flex>
      </Flex>
    </Card>
  )
}
