import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, type BadgeTone, Button, Card, Container, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useDocumentStore} from 'sanity'
import {Flex, Box} from 'ui5'

import {formatValue} from '../trends/data'
import {ciRunUrl, commitUrl} from '../trends/links'
import {
  type ComparisonMetric,
  type ComparisonRun,
  type ComparisonVerdict,
  COMPARISONS_QUERY,
  verdictSummary,
} from './data'

// Display order: problems first
const VERDICTS: ComparisonVerdict[] = ['regression', 'improvement', 'inconclusive', 'neutral']

const VERDICT_TONE: Record<ComparisonVerdict, BadgeTone> = {
  regression: 'critical',
  improvement: 'positive',
  neutral: 'default',
  inconclusive: 'caution',
}

const VERDICT_MARK: Record<ComparisonVerdict, string> = {
  regression: '🔴',
  improvement: '🟢',
  neutral: '✅',
  inconclusive: '⚪',
}

interface LiveState {
  runs: ComparisonRun[] | null
  error: string | null
}

/**
 * Every A/B dispatch stores its comparison as a `mode: 'ab'` document — this
 * tool is where those investigations are read back: newest first, each run a
 * card headed by the two commits and its verdict counts, expanding to the
 * per-metric table (reference vs experiment, Δ with its CI, verdict). The
 * Trends tool answers "did something change?"; this one holds the "which
 * commit did it?" evidence.
 */
export function ComparisonsTool() {
  const documentStore = useDocumentStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Realtime, same pattern as TrendsTool: a dispatched comparison appears
  // when its run completes, without a reload
  const live$ = useMemo(
    () =>
      documentStore.listenQuery(COMPARISONS_QUERY, {}, {tag: 'metrics.comparisons'}).pipe(
        map((result): LiveState => ({runs: result as ComparisonRun[], error: null})),
        catchError((error: unknown) =>
          of<LiveState>({
            runs: null,
            error: error instanceof Error ? error.message : String(error),
          }),
        ),
      ),
    [documentStore],
  )
  const live = useObservable(live$, {runs: null, error: null})

  return (
    <Box padding={4} style={{overflowY: 'auto', height: '100%'}}>
      <Container width={2}>
        <Stack gap={4}>
          <Stack gap={3}>
            <Text size={3} weight="semibold">
              A/B comparisons
            </Text>
            <Text size={1} muted>
              Each entry is one dispatched comparison of two commits (reference → experiment),
              stored when its run completes. Dispatch one from a trend point&apos;s &quot;Copy A/B
              vs previous run&quot; button, or directly:
            </Text>
            <Card padding={3} radius={2} tone="transparent" border>
              <Text size={1}>
                <code>gh workflow run bench.yml -f ab_from=&lt;sha&gt; -f ab_to=&lt;sha&gt;</code>
              </Text>
            </Card>
          </Stack>

          {live.error && (
            <Card padding={4} radius={3} tone="critical">
              <Text size={1}>Failed to load comparisons: {live.error}</Text>
            </Card>
          )}
          {!live.error && live.runs === null && (
            <Text size={1} muted>
              Loading…
            </Text>
          )}
          {live.runs?.length === 0 && (
            <Card padding={4} radius={3} tone="transparent" border>
              <Text size={1} muted>
                No comparisons stored yet.
              </Text>
            </Card>
          )}

          {live.runs?.map((run) => (
            <ComparisonCard
              key={run._id}
              run={run}
              expanded={expandedId === run._id}
              onToggle={() => setExpandedId((current) => (current === run._id ? null : run._id))}
            />
          ))}
        </Stack>
      </Container>
    </Box>
  )
}

function ComparisonCard(props: {run: ComparisonRun; expanded: boolean; onToggle: () => void}) {
  const {run, expanded, onToggle} = props
  const counts = verdictSummary(run)
  const fromSha = run.git?.mergeBaseSha
  const toSha = run.git?.sha

  return (
    <Card padding={4} radius={3} border>
      <Stack gap={4}>
        <Flex alignItems="center" gap={3} flexWrap="wrap">
          <Button
            mode="bleed"
            padding={2}
            fontSize={1}
            icon={expanded ? ChevronDownIcon : ChevronRightIcon}
            aria-label={expanded ? 'Collapse metric details' : 'Expand metric details'}
            aria-expanded={expanded}
            onClick={onToggle}
          />
          <Box flexBasis="0%" flexGrow={1}>
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              <ShaLink sha={fromSha} />
              <Text size={1} muted>
                →
              </Text>
              <ShaLink sha={toSha} />
            </Flex>
          </Box>
          {VERDICTS.filter((verdict) => counts[verdict] > 0).map((verdict) => (
            <Badge key={verdict} tone={VERDICT_TONE[verdict]} fontSize={0}>
              {VERDICT_MARK[verdict]} {counts[verdict]} {verdict}
            </Badge>
          ))}
          <Text size={0} muted>
            {run.startedAt.slice(0, 10)}
          </Text>
          {run.runner?.runId && (
            <Button
              as="a"
              href={ciRunUrl(run.runner.runId, run.runner.runAttempt)}
              target="_blank"
              rel="noreferrer"
              aria-label="CI run (opens in a new tab)"
              mode="ghost"
              fontSize={1}
              icon={LaunchIcon}
              text="Run"
            />
          )}
        </Flex>

        {expanded &&
          (run.scenarios ?? []).map((scenario) => (
            <Stack key={`${scenario.mode ?? scenario.kind}-${scenario.scenario}`} gap={3}>
              <Text size={1} weight="medium">
                {scenario.scenario} · {scenario.mode ?? scenario.kind}
              </Text>
              <Stack gap={2}>
                {(scenario.metrics ?? []).map((metric) => (
                  <MetricRow key={metric.label} metric={metric} />
                ))}
              </Stack>
            </Stack>
          ))}
      </Stack>
    </Card>
  )
}

function ShaLink(props: {sha: string | undefined}) {
  const {sha} = props
  if (!sha) {
    return (
      <Text size={1} muted>
        unknown
      </Text>
    )
  }
  return (
    <Text size={1}>
      <a href={commitUrl(sha)} target="_blank" rel="noreferrer">
        <code>{sha.slice(0, 10)}</code>
      </a>
    </Text>
  )
}

function MetricRow(props: {metric: ComparisonMetric}) {
  const {metric} = props
  const reference = metric.reference?.summary?.median
  const experiment = metric.experiment?.summary?.median
  const {comparison} = metric
  // A metric with no comparison (reference side missing) has nothing to judge
  const sign = (value: number) => `${value >= 0 ? '+' : ''}${formatValue(value, metric.unit)}`

  return (
    <Flex alignItems="center" gap={3} flexWrap="wrap">
      <Box style={{width: 220}}>
        <Text size={1} textOverflow="ellipsis">
          {metric.label}
        </Text>
      </Box>
      <Text size={1} muted>
        {reference === undefined || reference === null ? '—' : formatValue(reference, metric.unit)}
      </Text>
      <Text size={1} muted>
        →
      </Text>
      <Text size={1}>
        {experiment === undefined || experiment === null
          ? '—'
          : formatValue(experiment, metric.unit)}
      </Text>
      {comparison && (
        <>
          <Text size={1} muted>
            Δ {sign(comparison.diff)} [{sign(comparison.lo)}, {sign(comparison.hi)}]
          </Text>
          <Badge tone={VERDICT_TONE[comparison.verdict]} fontSize={0}>
            {VERDICT_MARK[comparison.verdict]} {comparison.verdict}
          </Badge>
        </>
      )}
    </Flex>
  )
}
