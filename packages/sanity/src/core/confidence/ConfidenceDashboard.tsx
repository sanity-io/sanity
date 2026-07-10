/* Confidence-surface prototype UI (overhaul branch) — deliberately not
 * localized and not for upstream. See BRIEF-ADDENDUM-confidence-surface.
 * ALL DATA ON THIS SURFACE IS MOCK — labeled illustrative by design. */
import {SparklesIcon} from '@sanity/icons'
import {Badge, Box, Card, Container, Flex, Grid, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../ui-components'
import {getFiveCsDwell, getTtccSeries} from './mock'
import {type TrustTier} from './mock/types'

const TIERS: TrustTier[] = ['T0', 'T1', 'T2', 'T3']

const ChartSvg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
`

function LineChart(props: {
  series: Array<{label: string; values: number[]; color: string; dashed?: boolean}>
  max: number
  unit: string
}) {
  const {series, max, unit} = props
  const width = 320
  const height = 120
  const pad = 8

  const toPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const x = pad + (index / (values.length - 1)) * (width - pad * 2)
        const y = height - pad - (value / max) * (height - pad * 2)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

  return (
    <Stack space={2}>
      <ChartSvg viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="var(--card-border-color)"
        />
        {series.map((entry) => (
          <polyline
            key={entry.label}
            points={toPoints(entry.values)}
            fill="none"
            stroke={entry.color}
            strokeWidth={2}
            strokeDasharray={entry.dashed ? '4 3' : undefined}
          />
        ))}
      </ChartSvg>
      <Flex gap={3} wrap="wrap">
        {series.map((entry) => (
          <Flex align="center" gap={1} key={entry.label}>
            <span
              style={{
                width: 12,
                height: 2,
                background: entry.color,
                display: 'inline-block',
                borderBottom: entry.dashed ? '1px dashed' : undefined,
              }}
            />
            <Text muted size={0}>
              {entry.label} ({unit})
            </Text>
          </Flex>
        ))}
      </Flex>
    </Stack>
  )
}

/**
 * The mock confidence dashboard: TTCC and CCFR side by side (never TTCC
 * alone), the fast/safe 2×2, and the Five C's dwell — all segmented by
 * trust tier (never pooled). Explicitly illustrative.
 *
 * @internal
 */
export function ConfidenceDashboard() {
  const [tier, setTier] = useState<TrustTier>('T1')

  const series = useMemo(() => getTtccSeries(tier), [tier])
  const dwell = useMemo(() => getFiveCsDwell(tier), [tier])

  const ttccMax = Math.max(...series.map((point) => point.ttccP90Hours)) * 1.15
  const ccfrMax = Math.max(...series.map((point) => point.ccfrPercent)) * 1.3
  const dwellMax = Math.max(...dwell.map((phase) => phase.hours))

  const latest = series[series.length - 1]

  return (
    <Box height="fill" overflow="auto" padding={4}>
      <Container width={2}>
        <Stack space={5}>
          <Flex align="center" gap={3} wrap="wrap">
            <Text size={2} weight="semibold">
              <SparklesIcon /> Confidence dashboard
            </Text>
            <Badge tone="primary">Tier-segmented</Badge>
            <Badge mode="outline" tone="caution">
              Illustrative — real measurement requires internal instrumentation (a stable change
              identity + the BQ pipeline)
            </Badge>
          </Flex>

          <Flex gap={2}>
            {TIERS.map((entry) => (
              <Button
                key={entry}
                mode={entry === tier ? 'default' : 'ghost'}
                onClick={() => setTier(entry)}
                text={entry}
                tone={entry === tier ? 'primary' : 'default'}
              />
            ))}
          </Flex>

          <Grid columns={[1, 1, 2]} gap={4}>
            <Card border padding={4} radius={2}>
              <Stack space={4}>
                <Flex align="center" gap={2}>
                  <Text size={1} weight="semibold">
                    Time to Confident Change (TTCC)
                  </Text>
                  <Badge>{latest.ttccMedianHours.toFixed(1)}h median</Badge>
                </Flex>
                <LineChart
                  max={ttccMax}
                  unit="hours"
                  series={[
                    {
                      label: 'median',
                      values: series.map((point) => point.ttccMedianHours),
                      color: '#2276fc',
                    },
                    {
                      label: 'p90',
                      values: series.map((point) => point.ttccP90Hours),
                      color: '#2276fc',
                      dashed: true,
                    },
                  ]}
                />
              </Stack>
            </Card>

            <Card border padding={4} radius={2}>
              <Stack space={4}>
                <Flex align="center" gap={2}>
                  <Text size={1} weight="semibold">
                    Confident-Change Failure Rate (CCFR)
                  </Text>
                  <Badge tone="caution">{latest.ccfrPercent.toFixed(1)}%</Badge>
                </Flex>
                <LineChart
                  max={ccfrMax}
                  unit="%"
                  series={[
                    {
                      label: 'CCFR',
                      values: series.map((point) => point.ccfrPercent),
                      color: '#f03e2f',
                    },
                  ]}
                />
                <Text muted size={0}>
                  Always read TTCC and CCFR together: speed that raises the failure rate is not
                  confidence.
                </Text>
              </Stack>
            </Card>

            <Card border padding={4} radius={2}>
              <Stack space={4}>
                <Text size={1} weight="semibold">
                  Five C&apos;s dwell — where the hours go
                </Text>
                <Stack space={3}>
                  {dwell.map((phase) => (
                    <Flex align="center" gap={3} key={phase.phase}>
                      <Box style={{width: 90}}>
                        <Text muted size={1}>
                          {phase.phase}
                        </Text>
                      </Box>
                      <Box flex={1}>
                        <Card
                          radius={2}
                          style={{
                            height: 10,
                            width: `${(phase.hours / dwellMax) * 100}%`,
                            background: '#2276fc',
                          }}
                        />
                      </Box>
                      <Text muted size={0}>
                        {phase.hours.toFixed(1)}h
                      </Text>
                    </Flex>
                  ))}
                </Stack>
              </Stack>
            </Card>

            <Card border padding={4} radius={2}>
              <Stack space={4}>
                <Text size={1} weight="semibold">
                  Fast / safe
                </Text>
                <Grid columns={2} gap={2}>
                  {[
                    {label: 'Slow · Safe', active: tier === 'T0'},
                    {label: 'Fast · Safe', active: tier === 'T1' || tier === 'T2'},
                    {label: 'Slow · Risky', active: false},
                    {label: 'Fast · Risky', active: tier === 'T3'},
                  ].map((cell) => (
                    <Card
                      border
                      key={cell.label}
                      padding={4}
                      radius={2}
                      tone={cell.active ? 'primary' : 'transparent'}
                    >
                      <Text align="center" muted={!cell.active} size={1}>
                        {cell.label}
                      </Text>
                    </Card>
                  ))}
                </Grid>
                <Text muted size={0}>
                  The goal is the fast-and-safe cell — earned tier by tier, never assumed.
                </Text>
              </Stack>
            </Card>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}
