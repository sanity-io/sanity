import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {Badge, Button, Card, Spinner, Text} from '@sanity/ui'
import {ParentSize} from '@visx/responsive'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, combineLatest, map, type Observable, of} from 'rxjs'
import {useDocumentStore} from 'sanity'
import {Flex, Grid, VStack} from 'ui5'

import {CALIBRATION_EXPLAINER, type TrendTag} from './data'
import {type DebugSource} from './debugData'
import {commitUrl} from './links'
import {
  filterSqrlByRange,
  formatCommitDate,
  formatScore,
  formatSignedPoints,
  hostNote,
  orderedPillars,
  pillarLabelFor,
  regressedInputs,
  shapeSqrlSeries,
  SQRL_LATEST_QUERY,
  SQRL_SERIES_QUERY,
  sqrlChanges,
  type SqrlChange,
  type SqrlLatest,
  type SqrlPoint,
  type SqrlSeriesDocument,
  type SqrlState,
} from './sqrl'
import {SqrlChart} from './SqrlChart'
import {generateSqrlDebug, sqrlVariantForSource} from './sqrlDebugData'
import {useUrlState} from './useUrlState'

const LOADING: SqrlState = {status: 'loading'}
const CHART_HEIGHT = 120
const BREAKDOWN_ID = 'sqrl-breakdown'
const OPEN_VALUE = 'open'

type DocumentStore = ReturnType<typeof useDocumentStore>

function readyState(series: SqrlPoint[], latest: SqrlLatest | null): SqrlState {
  return {status: 'ready', series, latest, asOfMs: Date.now()}
}

function listenSqrlState(documentStore: DocumentStore): Observable<SqrlState> {
  const series$ = documentStore
    .listenQuery(SQRL_SERIES_QUERY, {}, {tag: 'metrics.sqrl.series'})
    .pipe(map((result: SqrlSeriesDocument[] | null) => shapeSqrlSeries(result)))
  const latest$ = documentStore
    .listenQuery(SQRL_LATEST_QUERY, {}, {tag: 'metrics.sqrl.latest'})
    .pipe(map((result: SqrlLatest | null | undefined) => result ?? null))
  return combineLatest([series$, latest$]).pipe(
    map(([series, latest]) => readyState(series, latest)),
    catchError((error: unknown) =>
      of<SqrlState>({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      }),
    ),
  )
}

function debugSqrlState(source: DebugSource): SqrlState {
  const {series, latest} = generateSqrlDebug(sqrlVariantForSource(source))
  return readyState(shapeSqrlSeries(series), latest)
}

function changeTone(points: number): 'positive' | 'caution' | 'default' {
  if (points > 0) return 'positive'
  if (points < 0) return 'caution'
  return 'default'
}

function ChangeRow(props: {change: SqrlChange | null; label: string}) {
  const {change, label} = props
  if (change === null) {
    return (
      <Text size={1} muted>
        {label}: no earlier score
      </Text>
    )
  }
  return (
    <Flex alignItems="center" gap={2}>
      <Badge tone={changeTone(change.points)} fontSize={1}>
        {formatSignedPoints(change.points)}
      </Badge>
      <Text size={1} muted>
        {label}
      </Text>
    </Flex>
  )
}

function Headline(props: {latest: SqrlLatest; series: SqrlPoint[]; asOfMs: number}) {
  const {latest, series, asOfMs} = props
  const changes = sqrlChanges(series, latest.score, asOfMs)
  const committedMs = new Date(latest.git.committedAt).getTime()
  return (
    <VStack gap={3}>
      <div
        data-testid="sqrl-score"
        style={{fontSize: 44, lineHeight: 1, fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}
      >
        {formatScore(latest.score)}
      </div>
      <ChangeRow change={changes.sinceThirtyDays} label="since 30 days ago" />
      <Text size={1} muted>
        Commit{' '}
        <a href={commitUrl(latest.git.sha)} target="_blank" rel="noreferrer">
          {latest.git.sha.slice(0, 7)}
        </a>
        {Number.isFinite(committedMs) ? ` · ${formatCommitDate(committedMs)}` : ''}
      </Text>
    </VStack>
  )
}

function PillarBreakdown(props: {latest: SqrlLatest}) {
  const pillars = orderedPillars(props.latest.pillars)
  return (
    <Grid
      gridTemplateColumns={[
        'repeat(2, minmax(0, 1fr))',
        'repeat(3, minmax(0, 1fr))',
        'repeat(6, minmax(0, 1fr))',
        'repeat(6, minmax(0, 1fr))',
      ]}
      gap={2}
    >
      {pillars.map((pillar) => (
        <Card
          key={pillar.key}
          border
          padding={3}
          radius={2}
          data-testid={`sqrl-pillar-${pillar.key}`}
        >
          <VStack gap={2}>
            <Text size={1} muted>
              {pillar.label}
            </Text>
            <Text size={3} weight="semibold">
              {formatScore(pillar.score)}
            </Text>
            <Text size={0} muted>
              {Math.round(pillar.weight * 100)}% of score
            </Text>
          </VStack>
        </Card>
      ))}
    </Grid>
  )
}

function RegressedInputs(props: {latest: SqrlLatest}) {
  const {latest} = props
  const regressed = regressedInputs(latest.inputs)
  if (regressed.length === 0) {
    return (
      <Text size={1} muted>
        No inputs are regressing.
      </Text>
    )
  }
  return (
    <Card tone="critical" border padding={3} radius={2} data-testid="sqrl-regressed-inputs">
      <VStack gap={3}>
        <Text size={1} weight="semibold">
          Regressed inputs ({regressed.length})
        </Text>
        <VStack gap={2}>
          {regressed.map((input) => (
            <Flex key={input.key} alignItems="center" justifyContent="space-between" gap={3}>
              <Text size={1}>
                {input.label}{' '}
                <span style={{opacity: 0.7}}>· {pillarLabelFor(latest, input.pillar)}</span>
              </Text>
              <Text size={1} weight="semibold" style={{fontVariantNumeric: 'tabular-nums'}}>
                {formatSignedPoints(input.contributionPoints)} pts
              </Text>
            </Flex>
          ))}
        </VStack>
        <Text size={0} muted>
          Last 7 runs worse than the prior 21; points are the input&apos;s contribution against the
          reference.
        </Text>
      </VStack>
    </Card>
  )
}

function Explainer(props: {latest: SqrlLatest | null}) {
  return (
    <VStack gap={2}>
      <Text size={1} muted>
        Higher is better. 100 is the late-June 2026 reference.
      </Text>
      <Text size={0} muted>
        Chart: the line is the 7-commit median, faint dots are each commit alone, dashed is the 100
        reference.
      </Text>
      <Text size={0} muted>
        {hostNote(props.latest)} {CALIBRATION_EXPLAINER}
      </Text>
    </VStack>
  )
}

function BannerHeader(props: {
  regressedCount: number
  expanded: boolean
  onToggle: () => void
  expandable: boolean
}) {
  const {regressedCount, expanded, onToggle, expandable} = props
  return (
    <Flex alignItems="center" justifyContent="space-between" gap={3}>
      <Flex alignItems="center" gap={2}>
        <Text size={2} weight="bold">
          SQRL
        </Text>
        <Text size={1} muted>
          Studio Quality: Reliability &amp; Latency
        </Text>
        {regressedCount > 0 && (
          <Button
            tone="critical"
            mode="ghost"
            radius="full"
            fontSize={0}
            padding={2}
            text={`${regressedCount} regressed`}
            aria-expanded={expanded}
            aria-controls={BREAKDOWN_ID}
            data-testid="sqrl-regressed-badge"
            onClick={expanded ? undefined : onToggle}
          />
        )}
      </Flex>
      {expandable && (
        <Button
          mode="bleed"
          fontSize={1}
          padding={2}
          icon={expanded ? ChevronUpIcon : ChevronDownIcon}
          text={expanded ? 'Hide breakdown' : 'Show breakdown'}
          aria-expanded={expanded}
          aria-controls={BREAKDOWN_ID}
          data-testid="sqrl-breakdown-toggle"
          onClick={onToggle}
        />
      )}
    </Flex>
  )
}

function Summary(props: {
  series: SqrlPoint[]
  latest: SqrlLatest
  asOfMs: number
  rangeDays: number | null
  tags: TrendTag[]
}) {
  const {series, latest, asOfMs, rangeDays, tags} = props
  const visibleSeries = filterSqrlByRange(series, rangeDays, asOfMs)
  return (
    <Grid
      gridTemplateColumns={[
        'minmax(0, 1fr)',
        'minmax(0, 1fr)',
        '240px minmax(0, 1fr)',
        '240px minmax(0, 1fr)',
      ]}
      gap={5}
    >
      <Headline latest={latest} series={series} asOfMs={asOfMs} />
      {visibleSeries.length === 0 ? (
        <Text size={1} muted>
          No SQRL scores in this range. Try a longer range.
        </Text>
      ) : (
        <ParentSize debounceTime={50} style={{height: CHART_HEIGHT}}>
          {({width}) => (
            <SqrlChart points={visibleSeries} tags={tags} width={width} height={CHART_HEIGHT} />
          )}
        </ParentSize>
      )}
    </Grid>
  )
}

export function SqrlBanner(props: {
  source: 'live' | DebugSource
  rangeDays: number | null
  tags: TrendTag[]
}) {
  const {source, rangeDays, tags} = props
  const documentStore = useDocumentStore()
  const [openParam, setOpenParam] = useUrlState('sqrl', '')
  const expanded = openParam === OPEN_VALUE
  const collapsed = openParam !== OPEN_VALUE
  const toggle = () => setOpenParam(expanded ? '' : OPEN_VALUE)
  const state$ = useMemo(
    () => (source === 'live' ? listenSqrlState(documentStore) : of(debugSqrlState(source))),
    [documentStore, source],
  )
  const state = useObservable(state$, LOADING)
  const latest = state.status === 'ready' ? state.latest : null
  const regressedCount = regressedInputs(latest?.inputs).length

  return (
    <Card border padding={3} radius={3} data-testid="sqrl-banner">
      <VStack gap={3}>
        <BannerHeader
          regressedCount={regressedCount}
          expanded={expanded}
          onToggle={toggle}
          expandable={latest !== null}
        />
        {state.status === 'loading' && (
          <Flex alignItems="center" justifyContent="center" padding={4}>
            <Spinner muted />
          </Flex>
        )}
        {state.status === 'error' && (
          <Card tone="critical" border padding={3} radius={2}>
            <Text size={1}>
              Couldn&apos;t load SQRL scores: {state.message}. Reload the page to try again.
            </Text>
          </Card>
        )}
        {state.status === 'ready' && latest === null && (
          <>
            <Card tone="transparent" border padding={4} radius={2} data-testid="sqrl-empty">
              <Text size={1} muted>
                No SQRL scores yet. CI scores every main commit the nightly benchmark measures; the
                first score appears here once that run lands.
              </Text>
            </Card>
            <Explainer latest={null} />
          </>
        )}
        {state.status === 'ready' && latest && (
          <>
            <Summary
              series={state.series}
              latest={latest}
              asOfMs={state.asOfMs}
              rangeDays={rangeDays}
              tags={tags}
            />
            <div id={BREAKDOWN_ID} hidden={collapsed}>
              <VStack gap={4}>
                <PillarBreakdown latest={latest} />
                <RegressedInputs latest={latest} />
                <Explainer latest={latest} />
              </VStack>
            </div>
          </>
        )}
      </VStack>
    </Card>
  )
}
