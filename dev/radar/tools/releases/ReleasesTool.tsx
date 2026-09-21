import {AddIcon} from '@sanity/icons/Add'
import {BugIcon} from '@sanity/icons/Bug'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {PackageIcon} from '@sanity/icons/Package'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Box, Button, Card, Container, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {Tooltip} from '@sanity/ui/tooltip'
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
import {type ReleaseRegression, RegressionsDialog} from './RegressionsDialog'
import {
  baseVersionOf,
  changelogUrl,
  compareTagsSemverDesc,
  npmxUrl,
  regressionsByTag,
  type ReleaseRegressions,
} from './releaseInfo'

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
 * changelog, npmx.dev), and the confirmed regressions bisect sessions have
 * attributed to it: the ones it INTRODUCED (blame, red), the ones it still
 * carried from earlier releases (inherited, amber) and the ones it fixed
 * (green) — a regression spans releases, and the three tones tell the span's
 * start and end apart from its middle. The changelog link needs the
 * release's base version — the previous release on the first-parent chain —
 * so off-mainline releases (maintenance lines) may lack it. Regressions found outside a bisect are added by hand via
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
  // `null` = closed; a tag name = opened from that release's row (preselected);
  // '' = opened from the header with nothing picked yet
  const [addingRegression, setAddingRegression] = useState<string | null>(null)
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
  // Display order only. The query orders by tag date and the list reads as a
  // version list (a maintenance patch cut last week belongs with its minor,
  // not on top) — but the lookups below keep the date order: `tagBySha` is
  // last-wins over tags sharing a commit, and sorting its source would flip
  // which tag names a release's base
  const sortedTags = useMemo(
    () => tags.toSorted((a, b) => compareTagsSemverDesc(a.tag, b.tag)),
    [tags],
  )
  const tagBySha = useMemo(() => new Map(tags.map((tag) => [tag.sha, tag.tag])), [tags])

  // Per-release base version (an O(chain) ancestry walk) — precomputed once
  // instead of per row per render across three live queries
  const baseVersions = useMemo(
    () => new Map(tags.map((tag) => [tag.tag, baseVersionOf(commitsBySha, tagBySha, tag)])),
    [tags, commitsBySha, tagBySha],
  )

  // Confirmed regressions per release along their span (introduced,
  // inherited, fixed) — the badges show the counts, the dialog behind them
  // the sessions. Each entry knows its introducing release: that is what the
  // dialog's "fixed in" candidates are relative to, also for inherited ones
  const regressions = useMemo(() => {
    const confirmed = (sessionsLive.data ?? []).flatMap((session) =>
      session.result?.regression && session.result.firstBadSha
        ? [{firstBadSha: session.result.firstBadSha, fixedIn: session.result.fixedIn, session}]
        : [],
    )
    const spans = regressionsByTag(commitsBySha, tags, confirmed)
    const introducedIn = new Map<string, string>()
    for (const [tag, {introduced}] of spans) {
      for (const item of introduced) introducedIn.set(item.session._id, tag)
    }
    const toEntry = (item: (typeof confirmed)[number]): ReleaseRegression => ({
      session: item.session,
      introducedIn: introducedIn.get(item.session._id) ?? '',
    })
    return new Map<string, ReleaseRegressions<ReleaseRegression>>(
      [...spans].map(([tag, span]) => [
        tag,
        {
          introduced: span.introduced.map(toEntry),
          inherited: span.inherited.map(toEntry),
          fixed: span.fixed.map(toEntry),
        },
      ]),
    )
  }, [sessionsLive.data, commitsBySha, tags])
  // The release whose regressions dialog is open; the list itself is read
  // live so a removal disappears without closing anything
  const [viewingRegressions, setViewingRegressions] = useState<string | null>(null)

  const error = tagsLive.error ?? commitsLive.error ?? sessionsLive.error

  const userName = currentUser?.name ?? currentUser?.email ?? 'unknown'
  // Async so the dialog can disable its submit until it settles
  const handleAddRegression = async (input: ManualRegressionInput) => {
    try {
      await reportRegression(client, input)
      setAddingRegression(null)
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
                  have pinned on it: introduced (blamed on the release that first shipped the
                  offending commit), inherited from an earlier release and not fixed yet, or fixed.
                </Text>
              </Stack>
            </Box>
            <Button
              icon={AddIcon}
              text="Add regression"
              mode="ghost"
              disabled={!tagsLive.data || !commitsLive.data}
              onClick={() => setAddingRegression('')}
            />
          </Flex>

          <Card padding={3} radius={2} tone="transparent" border>
            <Stack gap={3}>
              <Flex alignItems="center" gap={3}>
                <Box style={{flexShrink: 0}}>
                  <Flex as={Text} size={1} weight="medium" alignItems="center" gap={2}>
                    <SanityMonogram style={ICON_IN_FLEX} />
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

          {sortedTags.map((tag) => (
            <ReleaseRow
              key={tag._id}
              tag={tag}
              baseVersion={baseVersions.get(tag.tag)}
              regressions={regressions.get(tag.tag)}
              onShowRegressions={() => setViewingRegressions(tag.tag)}
              previewUrl={commitsBySha.get(tag.sha)?.testStudioUrl}
              previewPath={previewPath || undefined}
              onAddRegression={
                tagsLive.data && commitsLive.data ? () => setAddingRegression(tag.tag) : undefined
              }
            />
          ))}
        </Stack>
      </Container>

      {viewingRegressions !== null && (
        <RegressionsDialog
          tag={viewingRegressions}
          regressions={regressions.get(viewingRegressions)}
          tags={tags}
          client={client}
          onClose={() => setViewingRegressions(null)}
        />
      )}

      {addingRegression !== null && (
        <AddRegressionDialog
          tags={tags}
          commitsBySha={commitsBySha}
          createdBy={userName}
          initialTag={addingRegression || undefined}
          onClose={() => setAddingRegression(null)}
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
 * The Sanity monogram in currentColor (the mark from @sanity/logos without
 * its background tile — that package is not a dependency here). The glyph
 * spans 24…164 of a 192 box; the viewBox pads it to the same ~18% inset as
 * the @sanity/icons glyphs so it sits level with its neighbours.
 */
function SanityMonogram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-12 -12 216 216" width="1em" height="1em" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M160.077 112.697L154.865 103.629L129.659 118.981L157.655 83.3368L161.888 80.8533L160.841 79.2802L162.764 76.8232L153.929 69.4699L149.886 74.6225L68.2657 122.375L98.4429 86.0855L154.651 55.2759L149.311 44.953L118.696 61.7277L133.771 43.6096L125.134 36L91.2055 76.7966L57.5083 95.2771L83.307 61.1709L99.4731 52.757L94.3391 42.3192L47.2403 66.8361L60.0839 49.8405L51.1123 42.6551L24 78.5378L24.4207 78.8736L29.486 89.1877L59.543 73.5354L32.1474 109.745L36.6375 113.342L39.3075 118.504L70.9528 101.154L36.1052 143.065L44.742 150.674L46.4762 148.588L130.543 99.2454L102.632 134.792L103.088 135.172L103.045 135.199L108.831 145.265L145.954 122.649L131.659 145.716L141.24 152L164 115.278L160.077 112.697Z"
      />
    </svg>
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
  /** Absent when no confirmed regression touches this release. */
  regressions: ReleaseRegressions<ReleaseRegression> | undefined
  previewUrl: string | undefined
  previewPath: string | undefined
  /** Absent while the data the dialog needs is still loading. */
  onAddRegression: (() => void) | undefined
  onShowRegressions: () => void
}) {
  const {
    tag,
    baseVersion,
    regressions,
    previewUrl,
    previewPath,
    onAddRegression,
    onShowRegressions,
  } = props
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
        {tag.npm?.deprecated && (
          // npm state like the dist-tags, refreshed by every npm-collecting
          // sync; the message is what `npm install` prints
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>{tag.npm.deprecated}</Text>
              </Box>
            }
          >
            <Badge tone="caution" fontSize={0}>
              deprecated
            </Badge>
          </Tooltip>
        )}
        {/* Where a regression's span starts (introduced), runs (inherited)
            and ends (fixed), told apart by tone, icon and weight: the bordered red
            count is the one to read, the borderless amber count says the
            release still ships something older, the green count that it
            closed a span. Each opens the list behind it — that is also where
            a regression is removed again */}
        {regressions && regressions.introduced.length > 0 && (
          <Button
            mode="ghost"
            tone="critical"
            fontSize={0}
            padding={2}
            icon={BugIcon}
            text={`${regressions.introduced.length} introduced`}
            aria-label={`Show the ${pluralize(regressions.introduced.length, 'regression')} introduced in ${tag.tag}`}
            onClick={onShowRegressions}
          />
        )}
        {regressions && regressions.inherited.length > 0 && (
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>
                  {pluralize(regressions.inherited.length, 'regression')} introduced in an earlier
                  release and not fixed yet when {tag.tag} shipped
                </Text>
              </Box>
            }
          >
            <Button
              mode="bleed"
              tone="caution"
              fontSize={0}
              padding={2}
              icon={WarningOutlineIcon}
              text={`${regressions.inherited.length} inherited`}
              aria-label={`Show the ${pluralize(regressions.inherited.length, 'regression')} ${tag.tag} inherited from earlier releases`}
              onClick={onShowRegressions}
            />
          </Tooltip>
        )}
        {regressions && regressions.fixed.length > 0 && (
          <Button
            mode="bleed"
            tone="positive"
            fontSize={0}
            padding={2}
            icon={CheckmarkCircleIcon}
            text={`${regressions.fixed.length} fixed`}
            aria-label={`Show the ${pluralize(regressions.fixed.length, 'regression')} fixed in ${tag.tag}`}
            onClick={onShowRegressions}
          />
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
            <IconLink href={withReproPath(previewUrl, previewPath)} icon={SanityMonogram}>
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
        {/* Pin a regression on this release without picking it in the dialog */}
        <Tooltip
          content={
            <Box padding={2}>
              <Text size={1}>Report a regression introduced in {tag.tag}</Text>
            </Box>
          }
        >
          <Button
            mode="bleed"
            tone="critical"
            fontSize={1}
            padding={2}
            icon={BugIcon}
            text="Add regression"
            aria-label={`Report a regression introduced in ${tag.tag}`}
            disabled={!onAddRegression}
            onClick={onAddRegression}
          />
        </Tooltip>
      </Flex>
    </Card>
  )
}
