import {AddIcon} from '@sanity/icons/Add'
import {ArchiveIcon} from '@sanity/icons/Archive'
import {BugIcon} from '@sanity/icons/Bug'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {PackageIcon} from '@sanity/icons/Package'
import {RestoreIcon} from '@sanity/icons/Restore'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Box, Button, Card, Text} from '@sanity/ui'
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
import {Container, Flex, VStack} from 'ui5'

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
import {mergeChainVerdict, resolveSessionChains} from '../bisect/sessionChains'
import {type ManualRegressionInput, reportRegression} from '../bisect/sessions'
import {
  isSeverity,
  SEVERITIES,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  worstSeverity,
} from '../bisect/severity'
import {pluralize} from '../bisect/text'
import {releaseUrl} from '../trends/links'
import {useUrlState} from '../trends/useUrlState'
import {AddRegressionDialog} from './AddRegressionDialog'
import {type ReleaseRegression, RegressionsDialog} from './RegressionsDialog'
import {
  baseVersionOf,
  changelogUrl,
  compareTagsSemverDesc,
  groupDeprecatedRuns,
  groupTagsByMajor,
  majorOf,
  npmxUrl,
  regressionsByTag,
  type ReleaseRegressions,
  withoutEolLines,
} from './releaseInfo'
import {clearLineEol, markLineEol, RELEASE_LINES_QUERY, type ReleaseLineSlice} from './releaseLines'

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
 * so off-mainline releases (maintenance lines) may lack it. Regressions
 * found outside a bisect are added by hand via AddRegressionDialog, stored
 * as born-converged bisect sessions.
 *
 * Rows are grouped into release lines (one per major). A line can be marked
 * end of life from its header — a `releaseLine` document, user-owned like the
 * bisect sessions — which folds its releases into the header until expanded,
 * so the list stays about the lines anyone still runs. The line holding the
 * `latest` dist-tag cannot be marked.
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

  const linesLive = useObservable(
    useMemo(
      () =>
        documentStore.listenQuery(RELEASE_LINES_QUERY, {}, {tag: 'metrics.releases.lines'}).pipe(
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
  const lines = useMemo(() => groupTagsByMajor(sortedTags), [sortedTags])
  const eolByMajor = useMemo(
    () => new Map((linesLive.data ?? []).map((line) => [line.major, line])),
    [linesLive.data],
  )
  // Releases still worth picking: nobody reports a regression against, or
  // fixes one in, a line that is end of life. The full list stays for
  // attribution — the chain walks do not care about EOL
  const activeTags = useMemo(
    () => withoutEolLines(tags, new Set(eolByMajor.keys())),
    [tags, eolByMajor],
  )
  // The line people install by default can't be end of life, whatever else
  // is true about it
  const latestMajor = useMemo(() => {
    const latest = tags.find((tag) => tag.npm?.distTags?.includes('latest'))
    return latest ? majorOf(latest.tag) : undefined
  }, [tags])
  // EOL lines fold into their header; expanding is per line and per visit
  const [expandedLines, setExpandedLines] = useState<ReadonlySet<number>>(() => new Set())
  // Deprecated releases fold to one line — nobody should be installing
  // them, and their bugs still show on that line; expanding is per visit
  const [expandedDeprecated, setExpandedDeprecated] = useState<ReadonlySet<string>>(() => new Set())
  const toggleDeprecated = (id: string) =>
    setExpandedDeprecated((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const toggleLine = (major: number) =>
    setExpandedLines((current) => {
      const next = new Set(current)
      if (!next.delete(major)) next.add(major)
      return next
    })

  // Per-release base version (an O(chain) ancestry walk) — precomputed once
  // instead of per row per render across three live queries
  const baseVersions = useMemo(
    () => new Map(tags.map((tag) => [tag.tag, baseVersionOf(commitsBySha, tagBySha, tag)])),
    [tags, commitsBySha, tagBySha],
  )

  // Confirmed regressions per release along their span (introduced,
  // inherited, fixed) — the badges show the counts, the dialog behind them
  // the sessions. A refinement chain (a commit bisect narrowing a release
  // bisect) is ONE regression: its deepest verdict names the commit, its
  // annotations come from wherever in the chain they were made. Each entry
  // knows its introducing release: that is what the dialog's "fixed in"
  // candidates are relative to, also for inherited ones
  const regressions = useMemo(() => {
    const confirmed = resolveSessionChains(sessionsLive.data ?? []).flatMap((chain) => {
      const verdict = mergeChainVerdict(chain)
      if (!verdict.regression || !verdict.firstBadSha) return []
      // The chain as one session-shaped record: the root's title (the
      // readable "v6.9.1 → v6.9.2"), the merged annotations, and the id of
      // the session that holds the verdict — where "fixed in" is written
      const verdictSession =
        chain.sessions.find((session) => session._id === verdict.verdictSessionId) ?? chain.leaf
      const session: SessionSummary = {
        ...verdictSession,
        title: chain.root.title,
        description: verdict.description ?? null,
        result: {
          firstBadSha: verdict.firstBadSha,
          regression: true,
          note: verdict.note ?? null,
          severity: verdict.severity ?? null,
          linearIssue: verdict.linearIssue ?? null,
          fixedIn: verdict.fixedIn ?? null,
        },
      }
      return [
        {
          firstBadSha: verdict.firstBadSha,
          fixedIn: verdict.fixedIn,
          session,
          chainIds: chain.treeIds,
        },
      ]
    })
    const spans = regressionsByTag(commitsBySha, tags, confirmed)
    const introducedIn = new Map<string, string>()
    for (const [tag, {introduced}] of spans) {
      for (const item of introduced) introducedIn.set(item.session._id, tag)
    }
    const toEntry = (item: (typeof confirmed)[number]): ReleaseRegression => ({
      session: item.session,
      introducedIn: introducedIn.get(item.session._id) ?? '',
      chainIds: item.chainIds,
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

  const error = tagsLive.error ?? commitsLive.error ?? sessionsLive.error ?? linesLive.error

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

  const handleMarkEol = (major: number) => {
    markLineEol(client, {major, markedBy: userName}).catch((err: unknown) =>
      toast.push({
        status: 'error',
        title: `Could not mark v${major} end of life`,
        description: err instanceof Error ? err.message : String(err),
      }),
    )
  }
  const handleClearEol = (major: number) => {
    clearLineEol(client, major).catch((err: unknown) =>
      toast.push({
        status: 'error',
        title: `Could not reinstate v${major}`,
        description: err instanceof Error ? err.message : String(err),
      }),
    )
  }

  return (
    <Box padding={4} style={{overflowY: 'auto', height: '100%'}}>
      <Container size={2}>
        <VStack gap={4}>
          <Flex alignItems="center" gap={3}>
            <Box flex={1}>
              <VStack gap={3}>
                <Text size={3} weight="semibold">
                  Studio releases
                </Text>
                <Text size={1} muted>
                  Every synced release tag with its npm state and the regressions bisect sessions
                  have pinned on it: introduced (blamed on the release that first shipped the
                  offending commit), inherited from an earlier release and not fixed yet, or fixed.
                </Text>
              </VStack>
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
            <VStack gap={3}>
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
            </VStack>
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

          {lines.map((line) => {
            const {major} = line
            const eol = major === undefined ? undefined : eolByMajor.get(major)
            const expanded = major !== undefined && expandedLines.has(major)
            return (
              <VStack key={major ?? 'unversioned'} gap={3}>
                <ReleaseLineHeader
                  major={major}
                  releaseCount={line.tags.length}
                  eol={eol}
                  expanded={expanded}
                  // Marking waits for the lines to load, or a mark could race
                  // a reinstate this client has not seen yet
                  canMark={linesLive.data !== null}
                  isLatestLine={major !== undefined && major === latestMajor}
                  onToggleExpanded={major === undefined ? undefined : () => toggleLine(major)}
                  onMarkEol={major === undefined ? undefined : () => handleMarkEol(major)}
                  onClearEol={major === undefined ? undefined : () => handleClearEol(major)}
                />
                {(!eol || expanded) &&
                  groupDeprecatedRuns(line.tags).map((entry) => {
                    // Inside an expanded run the releases are shown in full:
                    // the run's line already said they are deprecated and
                    // why, so a second fold and a second warning per release
                    // would only be clicking for its own sake
                    const row = (tag: TagSlice, inRun = false) => (
                      <ReleaseRow
                        key={tag._id}
                        tag={tag}
                        baseVersion={baseVersions.get(tag.tag)}
                        regressions={regressions.get(tag.tag)}
                        collapsed={
                          !inRun && Boolean(tag.npm?.deprecated) && !expandedDeprecated.has(tag._id)
                        }
                        onToggleCollapsed={
                          !inRun && tag.npm?.deprecated
                            ? () => toggleDeprecated(tag._id)
                            : undefined
                        }
                        showDeprecation={!inRun}
                        onShowRegressions={() => setViewingRegressions(tag.tag)}
                        previewUrl={commitsBySha.get(tag.sha)?.testStudioUrl}
                        previewPath={previewPath || undefined}
                        onAddRegression={
                          tagsLive.data && commitsLive.data
                            ? () => setAddingRegression(tag.tag)
                            : undefined
                        }
                      />
                    )
                    if (entry.kind === 'tag') return row(entry.tag)
                    // Neighbouring releases deprecated with one message fold
                    // into one line — the fold state is keyed by the run's
                    // newest tag, so it survives the run growing at the old end
                    const runKey = `run:${entry.tags[0]._id}`
                    return (
                      <DeprecatedRunRow
                        key={runKey}
                        tags={entry.tags}
                        message={entry.message}
                        expanded={expandedDeprecated.has(runKey)}
                        onToggle={() => toggleDeprecated(runKey)}
                      >
                        {entry.tags.map((tag) => row(tag, true))}
                      </DeprecatedRunRow>
                    )
                  })}
              </VStack>
            )
          })}
        </VStack>
      </Container>

      {viewingRegressions !== null && (
        <RegressionsDialog
          tag={viewingRegressions}
          regressions={regressions.get(viewingRegressions)}
          tags={activeTags}
          client={client}
          onClose={() => setViewingRegressions(null)}
        />
      )}

      {addingRegression !== null && (
        <AddRegressionDialog
          tags={activeTags}
          allTags={tags}
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
 * The heading of one release line (major): how many releases and how many
 * regressions the line introduced, plus the end-of-life toggle. A live line is
 * a plain heading with a quiet "Mark end of life" action; an EOL line becomes
 * a card that stands in for its releases — when it was marked and by whom, a
 * disclosure to show them anyway, and "Reinstate", which deletes the mark.
 */
function ReleaseLineHeader(props: {
  major: number | undefined
  releaseCount: number
  eol: ReleaseLineSlice | undefined
  expanded: boolean
  canMark: boolean
  isLatestLine: boolean
  /** Absent for the trailing group of tags that don't parse as semver. */
  onToggleExpanded: (() => void) | undefined
  onMarkEol: (() => void) | undefined
  onClearEol: (() => void) | undefined
}) {
  const {
    major,
    releaseCount,
    eol,
    expanded,
    canMark,
    isLatestLine,
    onToggleExpanded,
    onMarkEol,
    onClearEol,
  } = props
  const title = major === undefined ? 'Other tags' : `v${major}`
  // Releases only: what the line broke is on each release's own row, and
  // a total here read as an accusation against the whole line
  const summary = pluralize(releaseCount, 'release')

  if (eol) {
    return (
      <Card padding={3} radius={2} border tone="transparent">
        <Flex alignItems="center" gap={3} flexWrap="wrap">
          <Box style={{width: 110, flexShrink: 0}}>
            <Text size={2} weight="medium" muted>
              {title}
            </Text>
          </Box>
          <Badge tone="default" fontSize={0}>
            end of life
          </Badge>
          <Text size={1} muted>
            {summary}
          </Text>
          {eol.eolMarkedAt && (
            <Flex as={Text} size={1} muted alignItems="center" gap={1}>
              <span>· marked by {eol.eolMarkedBy ?? 'unknown'}</span>
              <RelativeDate dateTime={eol.eolMarkedAt} size={1} muted />
            </Flex>
          )}
          <Box flex={1} />
          <Button
            mode="bleed"
            fontSize={1}
            padding={2}
            icon={expanded ? ChevronDownIcon : ChevronRightIcon}
            text={expanded ? 'Hide releases' : 'Show releases'}
            aria-expanded={expanded}
            onClick={onToggleExpanded}
          />
          <Button
            mode="bleed"
            fontSize={1}
            padding={2}
            icon={RestoreIcon}
            text="Reinstate"
            aria-label={`Reinstate ${title}: remove its end-of-life mark`}
            disabled={!canMark}
            onClick={onClearEol}
          />
        </Flex>
      </Card>
    )
  }

  return (
    <Flex alignItems="center" gap={3} paddingTop={2} paddingX={1}>
      <Text size={1} weight="semibold">
        {title}
      </Text>
      <Text size={1} muted>
        {summary}
      </Text>
      <Box flex={1} />
      {onMarkEol && (
        <Tooltip
          content={
            <Box padding={2}>
              <Text size={1}>
                {isLatestLine
                  ? `${title} holds the latest dist-tag and cannot be end of life`
                  : `Fold every ${title} release into this heading — reversible`}
              </Text>
            </Box>
          }
        >
          <Button
            mode="bleed"
            fontSize={0}
            padding={2}
            icon={ArchiveIcon}
            text="Mark end of life"
            aria-label={`Mark ${title} end of life`}
            disabled={!canMark || isLatestLine}
            onClick={onMarkEol}
          />
        </Tooltip>
      )}
    </Flex>
  )
}

/**
 * A span of neighbouring releases deprecated with the same message, as one
 * line: the version range, how many, a deprecated badge carrying the message,
 * a disclosure. Expanded, it shows the releases themselves in full; the
 * badge's tooltip is where the message lives.
 */
function DeprecatedRunRow(props: {
  /** Newest first, as the list is ordered. */
  tags: TagSlice[]
  message: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const {tags, message, expanded, onToggle, children} = props
  const newest = tags[0].tag
  const oldest = tags.at(-1)!.tag
  const range = `${oldest} – ${newest}`
  return (
    <Card padding={2} radius={2} border tone="transparent">
      <VStack gap={2}>
        <Flex alignItems="center" gap={3} flexWrap="wrap">
          <Flex alignItems="center" gap={2}>
            <Text size={2} weight="medium" muted>
              {range}
            </Text>
            <Text size={1} muted>
              {pluralize(tags.length, 'release')}
            </Text>
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>{message}</Text>
                </Box>
              }
            >
              <Badge tone="caution" fontSize={0}>
                deprecated
              </Badge>
            </Tooltip>
          </Flex>
          <Box flex={1} />
          <Button
            mode="bleed"
            fontSize={1}
            padding={2}
            icon={expanded ? ChevronDownIcon : ChevronRightIcon}
            text={expanded ? 'Hide releases' : 'Show releases'}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide' : 'Show'} the ${pluralize(tags.length, 'deprecated release')} ${range}`}
            onClick={onToggle}
          />
        </Flex>
        {expanded && <VStack gap={2}>{children}</VStack>}
      </VStack>
    </Card>
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
  /** A deprecated release folded to its first line. */
  collapsed: boolean
  /** Present for deprecated releases only — the fold toggle. */
  onToggleCollapsed: (() => void) | undefined
  /** False inside a deprecation run, whose heading already carries the message. */
  showDeprecation: boolean
}) {
  const {
    tag,
    baseVersion,
    regressions,
    previewUrl,
    previewPath,
    onAddRegression,
    onShowRegressions,
    collapsed,
    onToggleCollapsed,
    showDeprecation,
  } = props
  const version = tag.tag.replace(/^v/, '')
  const hasRegressions =
    regressions !== undefined &&
    regressions.introduced.length + regressions.inherited.length + regressions.fixed.length > 0
  // Severity is shown by ORIGIN, so a critical regression a release merely
  // inherited never reads as one it introduced: the badges next to the
  // version and the tone of the introduced count are about what this
  // release broke; the inherited count takes the tone of what it carries.
  // The introduced count is toned by its worst rated severity and reads as a
  // warning (amber) while unrated — introducing a regression is a warning
  // in itself; red always means someone rated it critical
  const severities = (entries: ReleaseRegression[] | undefined) =>
    (entries ?? []).map((entry) => entry.session.result?.severity)
  const worstIntroduced = worstSeverity(severities(regressions?.introduced))
  const worstInherited = worstSeverity(severities(regressions?.inherited))
  // What bugs were IN the release — introduced here or inherited, not the
  // ones it fixed — one badge per severity, worst first, unrated last:
  // "1 critical · 2 major · 1 minor · 1 unrated". Origin is the count
  // group's business below
  const present = [...(regressions?.introduced ?? []), ...(regressions?.inherited ?? [])]
  const presentBySeverity = [...SEVERITIES.toReversed(), undefined].flatMap((severity) => {
    const count = present.filter((entry) => {
      const rated = entry.session.result?.severity
      return severity === undefined ? !isSeverity(rated) : rated === severity
    }).length
    return count > 0 ? [{severity, count}] : []
  })
  // The version opens the gitTag document in the structure tool — the raw
  // synced record behind the row
  const documentLink = useIntentLink({intent: 'edit', params: {id: tag._id, type: 'gitTag'}})

  return (
    <Card
      padding={collapsed ? 2 : 3}
      radius={2}
      border
      tone={collapsed ? 'transparent' : 'default'}
    >
      {/* Two deliberate lines rather than one that wraps wherever the width
          runs out: the first is identity (which release, what npm calls it,
          what was broken in it, when and how much it is used), the second has
          the links out on the left and everything about regressions — the
          span counts and the report action — together on the right. A
          deprecated release keeps only the first line until expanded. */}
      <VStack gap={3}>
        <Flex alignItems="center" gap={3} flexWrap="wrap">
          {/* The version and what npm calls it read as one label */}
          <Flex alignItems="center" gap={2}>
            <Text size={2} weight="medium">
              <a href={documentLink.href} onClick={documentLink.onClick}>
                {tag.tag}
              </a>
            </Text>
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
            {/* The bugs in the release, next to its name — introduced here
                or inherited — so a reader can spot at a glance what shipped
                broken in it. Which of them are this release's own blame is
                the count group's business below. A folded deprecated
                release keeps them behind the disclosure: it is out of the
                running, so its bugs are history, not a warning */}
            {!collapsed &&
              presentBySeverity.map(({severity, count}) => {
                const label = severity ? SEVERITY_LABEL[severity].toLowerCase() : 'unrated'
                return (
                  <Tooltip
                    key={label}
                    content={
                      <Box padding={2}>
                        <Text size={1}>
                          {pluralize(count, `${label} regression`)} in {tag.tag} (introduced here or
                          inherited)
                        </Text>
                      </Box>
                    }
                  >
                    <Badge tone={severity ? SEVERITY_TONE[severity] : 'default'} fontSize={0}>
                      {count} {label}
                    </Badge>
                  </Tooltip>
                )
              })}
          </Flex>
          <Box flex={1} />
          {typeof tag.npm?.weeklyDownloads === 'number' && (
            <Text size={1} muted>
              {tag.npm.weeklyDownloads.toLocaleString('en-US')}/wk
            </Text>
          )}
          <RelativeDate dateTime={tag.npm?.publishedAt ?? tag.taggedAt} size={1} muted />
          {onToggleCollapsed && (
            <Button
              mode="bleed"
              fontSize={1}
              padding={2}
              icon={collapsed ? ChevronRightIcon : ChevronDownIcon}
              aria-label={collapsed ? `Show ${tag.tag}'s details` : `Fold ${tag.tag}`}
              aria-expanded={!collapsed}
              onClick={onToggleCollapsed}
            />
          )}
        </Flex>

        {/* The deprecation, in full, once the row is open: the badge on the
            first line only says that it is, this says why — what npm prints */}
        {!collapsed && showDeprecation && tag.npm?.deprecated && (
          <Card padding={3} radius={2} tone="caution">
            <Flex as={Text} size={1} alignItems="flex-start" gap={2}>
              <WarningOutlineIcon style={ICON_IN_FLEX} />
              <span style={{overflowWrap: 'anywhere'}}>Deprecated: {tag.npm.deprecated}</span>
            </Flex>
          </Card>
        )}
        {!collapsed && (
          <Flex alignItems="center" gap={3} flexWrap="wrap">
            {/* One icon per destination so the line scans without reading the labels */}
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
            <Box flex={1} />
            {/* One labelled group for everything about regressions, so the
              counts and the report action read as one thing: the label
              carries the noun, the counts say where a span starts
              (introduced), runs (inherited) and ends (fixed) — told apart by
              tone and icon, the introduced count toned by its worst rated
              severity and amber while unrated — and "Add" pins a new one on
              this release. Each count
              opens the list behind it, which is also where a regression is
              removed again */}
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              <Text size={1} muted>
                {hasRegressions ? 'Regressions' : 'No known regressions'}
              </Text>
              {regressions && regressions.introduced.length > 0 && (
                <Tooltip
                  content={
                    <Box padding={2}>
                      <Text size={1}>
                        {pluralize(regressions.introduced.length, 'regression')} first shipped in{' '}
                        {tag.tag}
                        {worstIntroduced
                          ? ` — worst rated ${SEVERITY_LABEL[worstIntroduced].toLowerCase()}`
                          : ' — not rated yet'}
                      </Text>
                    </Box>
                  }
                >
                  <Button
                    mode="bleed"
                    tone={worstIntroduced ? SEVERITY_TONE[worstIntroduced] : 'caution'}
                    fontSize={0}
                    padding={2}
                    icon={BugIcon}
                    text={`${regressions.introduced.length} introduced`}
                    aria-label={`Show the ${pluralize(regressions.introduced.length, 'regression')} introduced in ${tag.tag}`}
                    onClick={onShowRegressions}
                  />
                </Tooltip>
              )}
              {regressions && regressions.inherited.length > 0 && (
                <Tooltip
                  content={
                    <Box padding={2}>
                      <Text size={1}>
                        {pluralize(regressions.inherited.length, 'regression')} introduced in an
                        earlier release and not fixed yet when {tag.tag} shipped
                        {worstInherited
                          ? ` — worst rated ${SEVERITY_LABEL[worstInherited].toLowerCase()}`
                          : ''}
                      </Text>
                    </Box>
                  }
                >
                  <Button
                    mode="bleed"
                    tone={worstInherited === 'critical' ? 'critical' : 'caution'}
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
              <Tooltip
                content={
                  <Box padding={2}>
                    <Text size={1}>Report a regression introduced in {tag.tag}</Text>
                  </Box>
                }
              >
                <Button
                  mode="bleed"
                  fontSize={0}
                  padding={2}
                  icon={AddIcon}
                  text="Add"
                  aria-label={`Report a regression introduced in ${tag.tag}`}
                  disabled={!onAddRegression}
                  onClick={onAddRegression}
                />
              </Tooltip>
            </Flex>
          </Flex>
        )}
      </VStack>
    </Card>
  )
}
