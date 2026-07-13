import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'

import {formatValue, type TrendSeries} from './data'
import {computeDrift, type DriftBaseline} from './drift'

const BASELINE_LABEL: Record<DriftBaseline['kind'], string> = {
  trailing: 'vs prior 3 weeks',
  step: 'vs same weekday',
}

function pct(fraction: number): string {
  const sign = fraction > 0 ? '+' : ''
  return `${sign}${(fraction * 100).toFixed(0)}%`
}

/**
 * "Changes to review" — surfaces metrics that drifted past the gate
 * thresholds so a reader doesn't have to eyeball every chart. Regressions
 * first. Silent (renders nothing) when everything is steady, so it never
 * adds noise on a healthy day.
 */
export function DriftFeed(props: {series: TrendSeries[]}) {
  const drift = computeDrift(props.series)
  if (drift.length === 0) return null

  const regressions = drift.filter((entry) => entry.direction === 'regression').length

  return (
    <Card tone={regressions > 0 ? 'caution' : 'positive'} border padding={3} radius={2}>
      <Stack space={3}>
        <Text size={1} weight="semibold">
          {regressions > 0
            ? `${regressions} metric${regressions === 1 ? '' : 's'} to review`
            : `${drift.length} improvement${drift.length === 1 ? '' : 's'}`}
        </Text>
        <Stack space={2}>
          {drift.map((entry) => {
            const worst = entry.fired.reduce((a, b) =>
              Math.abs(b.deltaFraction) > Math.abs(a.deltaFraction) ? b : a,
            )
            return (
              <Flex key={`${entry.seriesKey}:${entry.branch}`} align="center" gap={2} wrap="wrap">
                <Badge
                  tone={entry.direction === 'regression' ? 'critical' : 'positive'}
                  fontSize={0}
                  mode="outline"
                >
                  {entry.direction === 'regression' ? '↑ regression' : '↓ improvement'}
                </Badge>
                <Text size={1} weight="medium">
                  {entry.title}
                </Text>
                {props.series.some((s) => s.lines.length > 1) && (
                  <Text size={1} muted>
                    ({entry.branch})
                  </Text>
                )}
                <Text size={1}>{pct(worst.deltaFraction)}</Text>
                <Text size={0} muted>
                  {formatValue(worst.baseline, entry.unit)} →{' '}
                  {formatValue(worst.recent, entry.unit)}
                  {' · '}
                  {entry.fired.map((f) => BASELINE_LABEL[f.kind]).join(', ')}
                </Text>
              </Flex>
            )
          })}
        </Stack>
      </Stack>
    </Card>
  )
}
