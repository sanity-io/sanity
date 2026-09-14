import {AddIcon} from '@sanity/icons/Add'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {PackageIcon} from '@sanity/icons/Package'
import {Badge, Box, Button, Card, Container, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
  useMemo,
  useState,
} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useClient, useCurrentUser, useDocumentStore} from 'sanity'
import {useIntentLink} from 'sanity/router'
import {Flex} from 'ui5'

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
import {normalizeReproPath, withReproPath} from '../bisect/reproPath'
import {ReproPathInput} from '../bisect/ReproPathField'
import {type ManualRegressionInput, reportRegression} from '../bisect/sessions'
import {pluralize} from '../bisect/text'
import {releaseUrl} from '../trends/links'
import {useUrlState} from '../trends/useUrlState'
import {AddRegressionDialog} from './AddRegressionDialog'
import {baseVersionOf, changelogUrl, npmxUrl, regressionCountByTag} from './releaseInfo'

interface LiveState<T> {
  data: T | null
  error: string | null
}

/**
 * @sanity/ui's Text pulls icons in with a negative margin on every side so
 * they fit the cap height inline. In a flex row that eats the gap between
 * icon and label; keep the vertical part, drop the horizontal.
 */
const ICON_IN_FLEX: CSSProperties = {marginLeft: 0, marginRight: 0}

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
 *
 * The path field under the header holds a test-studio path — where the
 * issue under investigation reproduces — that every release's Test Studio link
 * opens at, so checking a repro across releases is one click per release. It
 * lives in the URL (`?path=`) like the other tool state: reload-safe and
 * shareable.
 */
export function ReleasesTool() {
  const documentStore = useDocumentStore()
  const client = useClient({apiVersion: '2025-02-19'})
  const currentUser = useCurrentUser()
  const toast = useToast()
  const [addingRegression, setAddingRegression] = useState(false)
  const [previewPath, setPreviewPath] = useUrlState('path', '')
  // Raw text while typing; the URL only ever gets the normalized path. The
  // draft is shown only while it still normalizes to the URL's value —
  // Back/Forward swaps the URL underneath it, and the field must follow
  const [previewPathDraft, setPreviewPathDraft] = useState(previewPath)
  const previewPathInput =
    (normalizeReproPath(previewPathDraft) ?? '') === previewPath ? previewPathDraft : previewPath
  const changePreviewPath = (next: string) => {
    setPreviewPathDraft(next)
    setPreviewPath(normalizeReproPath(next) ?? '')
  }

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
          <Flex alignItems="center" gap={3}>
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

          <Card padding={3} radius={2} tone="transparent" border>
            <Stack gap={3}>
              <Flex alignItems="center" gap={3}>
                <Box style={{flexShrink: 0}}>
                  <Flex as={Text} size={1} weight="medium" alignItems="center" gap={2}>
                    <EyeOpenIcon style={ICON_IN_FLEX} />
                    <span>Test Studio Path</span>
                  </Flex>
                </Box>
                <Box flex={1}>
                  <ReproPathInput
                    value={previewPathInput}
                    onChange={changePreviewPath}
                    placeholder="/test/structure/author;abc — or paste a test-studio URL"
                  />
                </Box>
                {previewPathInput && (
                  <Button
                    mode="ghost"
                    fontSize={1}
                    text="Clear"
                    onClick={() => changePreviewPath('')}
                  />
                )}
              </Flex>
              <Text size={0} muted>
                Every release's Test Studio link opens its preview build at this path — paste a
                test-studio URL and only its path is kept.
              </Text>
            </Stack>
          </Card>

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
              previewPath={previewPath || undefined}
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

/**
 * External link with a leading icon. Flex rather than inline SVG-in-text:
 * the @sanity/icons glyphs and the brand logos have different boxes, so
 * baseline alignment leaves them jittering against the label.
 */
function IconLink(props: {
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
}) {
  const {href, icon: Icon, children} = props
  return (
    <Text size={1}>
      <Flex as="a" href={href} target="_blank" rel="noreferrer" alignItems="center" gap={1}>
        <Icon style={ICON_IN_FLEX} />
        <span>{children}</span>
      </Flex>
    </Text>
  )
}

/**
 * GitHub mark in currentColor. @sanity/icons glyphs sit inset inside a
 * 25-unit box (about 4 units of air on each side); the viewBox here pads
 * the 24-unit mark the same way so it renders at the same visual size and
 * distance from its label as its neighbours.
 */
function GitHubLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-5 -5 34 34" width="1em" height="1em" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"
      />
    </svg>
  )
}

function ReleaseRow(props: {
  tag: TagSlice
  baseVersion: string | undefined
  regressions: number
  previewUrl: string | undefined
  previewPath: string | undefined
}) {
  const {tag, baseVersion, regressions, previewUrl, previewPath} = props
  const version = tag.tag.replace(/^v/, '')
  // The version opens the gitTag document in the structure tool — the raw
  // synced record behind the row
  const documentLink = useIntentLink({intent: 'edit', params: {id: tag._id, type: 'gitTag'}})

  return (
    <Card padding={3} radius={2} border>
      <Flex alignItems="center" gap={3} flexWrap="wrap">
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
        {/* One icon per destination so a row scans without reading the labels */}
        <Flex gap={3} flexWrap="wrap">
          {previewUrl && (
            <IconLink href={withReproPath(previewUrl, previewPath)} icon={EyeOpenIcon}>
              Test Studio
            </IconLink>
          )}
          <IconLink href={releaseUrl(tag.tag)} icon={GitHubLogo}>
            GitHub
          </IconLink>
          {baseVersion && (
            <IconLink href={changelogUrl(baseVersion)} icon={DocumentTextIcon}>
              Changelog
            </IconLink>
          )}
          <IconLink href={npmxUrl(version)} icon={PackageIcon}>
            npmx
          </IconLink>
        </Flex>
      </Flex>
    </Card>
  )
}
