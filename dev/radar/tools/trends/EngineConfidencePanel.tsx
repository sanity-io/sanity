import {
  CATALOGUE_SUITE_IDS,
  type CatalogueSuiteStatus,
  ENGINE_CONFIDENCE_MEASURE_IDS,
} from '@repo/utils/engine-confidence'
import {Badge, Card, Spinner, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Box, Flex, Grid, VStack} from 'ui5'

import {type TrendSeries, type TrendTag} from './data'
import {
  type CatalogueGridRow,
  catalogueGrid,
  type EngineConfidenceDetail,
  type EngineConfidenceRunSummary,
  type EngineMeasureSummary,
  engineMeasureTitle,
  worstFiles,
} from './engineConfidence'
import {WeeklyCard, type WeeklyVariant} from './WeeklyBars'

const SHARE_VARIANT: WeeklyVariant = {
  kind: 'share',
  fill: {label: 'Caught', color: 'var(--card-badge-positive-dot-color, #1baf7a)'},
  remainder: {label: 'Missed', color: 'var(--card-muted-fg-color, #727892)'},
}

const STATUS_PRESENTATION: Record<
  CatalogueSuiteStatus,
  {label: string; tone: 'positive' | 'critical' | 'default'}
> = {
  'caught': {label: 'caught', tone: 'positive'},
  'missed': {label: 'missed', tone: 'critical'},
  'not-applicable': {label: 'n/a', tone: 'default'},
  'not-run': {label: 'not run', tone: 'default'},
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

function percentLabel(ratio: number | null | undefined): string {
  return typeof ratio === 'number' ? `${(ratio * 100).toFixed(1)}%` : 'not measured'
}

function seriesFor(series: TrendSeries[], key: string): TrendSeries | undefined {
  return series.find((entry) => entry.key === key)
}

function hasPoints(series: TrendSeries | undefined): series is TrendSeries {
  return series !== undefined && series.lines.some((line) => line.points.length > 0)
}

function NotMeasuredCard(props: {title: string; reason: string}) {
  return (
    <Card border padding={3} radius={2} tone="transparent" data-testid="engine-not-measured">
      <VStack gap={3}>
        <Text size={1} weight="medium">
          {props.title}
        </Text>
        <Text size={1} muted>
          Not measured: {props.reason}
        </Text>
      </VStack>
    </Card>
  )
}

function MeasureCard(props: {
  series: TrendSeries | undefined
  title: string
  latestMeasure: EngineMeasureSummary
  tags: TrendTag[]
  cardId: (seriesKey: string) => string
  focusedKey: string | null
}) {
  const {series, title, latestMeasure, tags, cardId, focusedKey} = props
  if (!hasPoints(series)) {
    return (
      <NotMeasuredCard
        title={title}
        reason={latestMeasure.reason ?? 'no run in this range measured it'}
      />
    )
  }
  return (
    <VStack gap={2}>
      <WeeklyCard
        title={title}
        description={series.description}
        series={series}
        variant={SHARE_VARIANT}
        goal="higher"
        tags={tags}
        breaks={series.breaks}
        domId={cardId(series.key)}
        focused={focusedKey === series.key}
      />
      {latestMeasure.status === 'not-measured' && (
        <Text size={1} muted>
          Not measured in the latest week: {latestMeasure.reason ?? 'no reason recorded'}
        </Text>
      )}
    </VStack>
  )
}

function LatestWeekSummary(props: {run: EngineConfidenceRunSummary}) {
  const {run} = props
  const {generatedBugsCaught} = run.measures
  const targets = generatedBugsCaught.targets ?? []
  return (
    <Card border padding={3} radius={2} data-testid="engine-latest-week">
      <VStack gap={3}>
        <Flex alignItems="center" gap={2} flexWrap="wrap">
          <Text size={1} weight="medium">
            Latest week {run.isoWeek}
          </Text>
          <Badge fontSize={0} tone="primary">
            config v{run.config.version}
          </Badge>
        </Flex>
        <VStack gap={2}>
          <Text size={1}>Headline {percentLabel(run.headline.ratio)}</Text>
          {ENGINE_CONFIDENCE_MEASURE_IDS.map((measureId) => (
            <Text key={measureId} size={1} muted>
              {engineMeasureTitle(measureId)} {percentLabel(run.measures[measureId].ratio)}
            </Text>
          ))}
        </VStack>
        {generatedBugsCaught.counts ? (
          <Text size={1} muted data-testid="engine-mutant-exclusions">
            Mutants left out of the score:{' '}
            {NUMBER_FORMAT.format(generatedBugsCaught.counts.ignored)} ignored by rule,{' '}
            {NUMBER_FORMAT.format(generatedBugsCaught.counts.excluded)} excluded after review
          </Text>
        ) : null}
        <Text size={1} muted data-testid="engine-measures-used">
          Headline uses:{' '}
          {run.headline.measuresUsed.length === 0
            ? 'nothing measured'
            : run.headline.measuresUsed.map(engineMeasureTitle).join(', ')}
        </Text>
        {targets.length > 0 && (
          <VStack gap={2}>
            <Text size={0} muted weight="medium">
              Stryker
            </Text>
            {targets.map((target) => (
              <Text key={target.target} size={1} muted>
                {target.target}: {target.mode}
                {target.mode === 'incremental'
                  ? `, ${NUMBER_FORMAT.format(target.reusedMutants)} mutants reused`
                  : ''}
              </Text>
            ))}
          </VStack>
        )}
      </VStack>
    </Card>
  )
}

function CellText(props: {align?: 'left' | 'right'; children: ReactNode}) {
  return (
    <td style={{padding: '6px 8px', textAlign: props.align ?? 'left', whiteSpace: 'nowrap'}}>
      {props.children}
    </td>
  )
}

function HeaderText(props: {align?: 'left' | 'right'; children: ReactNode}) {
  return (
    <th style={{padding: '6px 8px', textAlign: props.align ?? 'left', fontWeight: 'normal'}}>
      <Text size={0} muted>
        {props.children}
      </Text>
    </th>
  )
}

function NumberCell(props: {children: ReactNode}) {
  return (
    <CellText align="right">
      <Text size={1}>{props.children}</Text>
    </CellText>
  )
}

const ROW_BORDER = {borderTop: '1px solid var(--card-border-color)'}

function WorstFilesTable(props: {detail: EngineConfidenceDetail}) {
  const files = worstFiles(props.detail)
  if (files.length === 0) {
    return (
      <Text size={1} muted>
        The latest week recorded no per-file results.
      </Text>
    )
  }
  return (
    <Card border radius={2} overflow="auto">
      <table style={{width: '100%', borderCollapse: 'collapse'}} data-testid="engine-worst-files">
        <thead>
          <tr>
            <HeaderText>File</HeaderText>
            <HeaderText align="right">Killed + timeout</HeaderText>
            <HeaderText align="right">Survived</HeaderText>
            <HeaderText align="right">No coverage</HeaderText>
            <HeaderText align="right">Ignored by rule</HeaderText>
            <HeaderText align="right">Excluded after review</HeaderText>
            <HeaderText align="right">Score</HeaderText>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.path} style={ROW_BORDER}>
              <td style={{padding: '6px 8px'}}>
                <Flex alignItems="center" gap={2}>
                  <Badge fontSize={0}>{file.target}</Badge>
                  <Text size={1}>{file.path.replace(/^packages\//, '')}</Text>
                </Flex>
              </td>
              <NumberCell>{file.counts.killed + file.counts.timeout}</NumberCell>
              <NumberCell>{file.counts.survived}</NumberCell>
              <NumberCell>{file.counts.noCoverage}</NumberCell>
              <NumberCell>{file.counts.ignored}</NumberCell>
              <NumberCell>{file.counts.excluded}</NumberCell>
              <NumberCell>{percentLabel(file.score)}</NumberCell>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function CatalogueRowTitle(props: {row: CatalogueGridRow}) {
  const {row} = props
  return (
    <Flex alignItems="center" gap={2}>
      <Badge fontSize={0} tone={row.severity === 'S1' ? 'critical' : 'caution'}>
        {row.severity}
      </Badge>
      <Text size={1} weight="medium">
        {row.id}
      </Text>
      {row.sourceUrl ? (
        <a
          href={row.sourceUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${row.id} ${row.title} (opens in a new tab)`}
        >
          <Text size={1}>{row.title}</Text>
        </a>
      ) : (
        <Text size={1}>{row.title}</Text>
      )}
    </Flex>
  )
}

function CatalogueTable(props: {detail: EngineConfidenceDetail}) {
  const grid = catalogueGrid(props.detail)
  if (grid.rows.length === 0) {
    return (
      <Text size={1} muted>
        The latest week recorded no catalogue results.
      </Text>
    )
  }
  return (
    <Card border radius={2} overflow="auto">
      <table style={{width: '100%', borderCollapse: 'collapse'}} data-testid="engine-catalogue">
        <thead>
          <tr>
            <HeaderText>Known bug</HeaderText>
            {CATALOGUE_SUITE_IDS.map((suite) => (
              <HeaderText key={suite}>{suite}</HeaderText>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row) => (
            <tr key={row.id} style={ROW_BORDER} data-testid={`engine-catalogue-${row.id}`}>
              <td style={{padding: '6px 8px'}}>
                <CatalogueRowTitle row={row} />
              </td>
              {row.cells.map((cell) => {
                const presentation = STATUS_PRESENTATION[cell.status]
                return (
                  <CellText key={cell.suite}>
                    <Badge
                      fontSize={0}
                      tone={presentation.tone}
                      data-status={cell.status}
                      aria-label={`${row.id} ${cell.suite}: ${presentation.label}`}
                    >
                      {presentation.label}
                    </Badge>
                  </CellText>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function SectionHeader(props: {title: string; note: string}) {
  return (
    <Flex alignItems="baseline" gap={2}>
      <Text size={1} weight="semibold">
        {props.title}
      </Text>
      <Text size={1} muted>
        {props.note}
      </Text>
    </Flex>
  )
}

/** `runs` are already narrowed to the page's range; `detail` is the newest run's per-file and per-entry results. */
export function EngineConfidencePanel(props: {
  runs: EngineConfidenceRunSummary[]
  series: TrendSeries[]
  detail: EngineConfidenceDetail | null
  loading: boolean
  error: string | null
  tags: TrendTag[]
  cardId: (seriesKey: string) => string
  focusedKey: string | null
}) {
  const {runs, series, detail, loading, error, tags, cardId, focusedKey} = props
  const latest = runs.at(-1)

  if (error) {
    return (
      <Card tone="critical" border padding={3} radius={2}>
        <Text size={1}>Couldn&apos;t load engine confidence runs: {error}.</Text>
      </Card>
    )
  }
  if (loading) {
    return (
      <Flex alignItems="center" justifyContent="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }
  if (latest === undefined) {
    return (
      <Card tone="transparent" border padding={4} radius={2}>
        <Text size={1} muted>
          No engine confidence runs in this range. The score is computed once a week from main; try
          a longer range, or use <code>?source=demo</code> to see the tab with sample data.
        </Text>
      </Card>
    )
  }

  const headlineSeries = seriesFor(series, 'engine:headline')
  return (
    <Flex gap={6} paddingTop={3} flexDirection="column">
      <VStack gap={4}>
        <Grid
          gridTemplateColumns={['repeat(1, minmax(0, 1fr))', 'repeat(2, minmax(0, 1fr))']}
          gap={3}
        >
          {hasPoints(headlineSeries) ? (
            <WeeklyCard
              title="Engine confidence"
              description={headlineSeries.description}
              series={headlineSeries}
              variant={SHARE_VARIANT}
              goal="higher"
              tags={tags}
              breaks={headlineSeries.breaks}
              domId={cardId(headlineSeries.key)}
              focused={focusedKey === headlineSeries.key}
            />
          ) : (
            <NotMeasuredCard
              title="Engine confidence"
              reason="no measure produced a score in this range"
            />
          )}
          <LatestWeekSummary run={latest} />
        </Grid>
        <Grid
          gridTemplateColumns={[
            'repeat(1, minmax(0, 1fr))',
            'repeat(2, minmax(0, 1fr))',
            'repeat(3, minmax(0, 1fr))',
          ]}
          gap={3}
        >
          {ENGINE_CONFIDENCE_MEASURE_IDS.map((measureId) => (
            <Box key={measureId}>
              <MeasureCard
                series={seriesFor(series, `engine:${measureId}`)}
                title={engineMeasureTitle(measureId)}
                latestMeasure={latest.measures[measureId]}
                tags={tags}
                cardId={cardId}
                focusedKey={focusedKey}
              />
            </Box>
          ))}
        </Grid>
      </VStack>
      {detail && (
        <>
          <VStack gap={3}>
            <SectionHeader
              title="Missed bugs by file"
              note={`top 10 by planted bugs no test caught, week ${detail.isoWeek}`}
            />
            <WorstFilesTable detail={detail} />
          </VStack>
          <VStack gap={3}>
            <SectionHeader
              title="Known bug catalogue"
              note={`which suite catches each entry, week ${detail.isoWeek}`}
            />
            <CatalogueTable detail={detail} />
          </VStack>
        </>
      )}
    </Flex>
  )
}
