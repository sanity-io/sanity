import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useDocumentStore} from 'sanity'

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
import {pluralize} from '../bisect/text'
import {releaseUrl} from '../trends/links'
import {baseVersionOf, changelogUrl, npmxUrl, regressionCountByTag} from './releaseInfo'

interface LiveState<T> {
  data: T | null
  error: string | null
}

/**
 * Every release, newest first: when it shipped (npm publish time when known),
 * which dist-tags point at it, weekly downloads, links out (GitHub release,
 * sanity.io changelog, npmx.dev), and how many confirmed regressions bisect
 * sessions have attributed to it (blamed on the INTRODUCING release). The
 * changelog link needs the release's base version — the previous release on
 * the first-parent chain — so off-mainline releases (maintenance lines) may
 * lack it.
 */
export function ReleasesTool() {
  const documentStore = useDocumentStore()

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

  return (
    <Box padding={4} style={{overflowY: 'auto', height: '100%'}}>
      <Container width={2}>
        <Stack gap={4}>
          <Stack gap={3}>
            <Text size={3} weight="semibold">
              Releases
            </Text>
            <Text size={1} muted>
              Every synced release tag with its npm state and the regressions bisect sessions have
              pinned on it (blamed on the release that first shipped the offending commit).
            </Text>
          </Stack>

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
            />
          ))}
        </Stack>
      </Container>
    </Box>
  )
}

function ReleaseRow(props: {tag: TagSlice; baseVersion: string | undefined; regressions: number}) {
  const {tag, baseVersion, regressions} = props
  const version = tag.tag.replace(/^v/, '')

  return (
    <Card padding={3} radius={2} border>
      <Flex align="center" gap={3} wrap="wrap">
        <Box style={{width: 110, flexShrink: 0}}>
          <Text size={2} weight="medium">
            {tag.tag}
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
