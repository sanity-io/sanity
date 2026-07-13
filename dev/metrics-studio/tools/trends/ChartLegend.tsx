import {Flex, Text} from '@sanity/ui'

import {type TrendSeries} from './data'
import {COLOR} from './TrendChart'

function Swatch(props: {children: React.ReactNode}) {
  return (
    <svg width={16} height={10} aria-hidden="true" style={{flexShrink: 0}}>
      {props.children}
    </svg>
  )
}

/**
 * Encoding key rendered under every chart: one series drawn three ways
 * (median line, percentile band, per-run dots) is not self-evident to a
 * first-time viewer. Identity stays in the marks; the words wear text tokens.
 */
export function ChartLegend(props: {series: TrendSeries}) {
  const {series} = props
  const color = series.goal === 'context' ? COLOR.context : COLOR.line
  const hasBand =
    series.points.length > 1 &&
    series.points.some((point) => point.p75 !== undefined && point.p90 !== undefined)
  const hasLine = series.points.length > 1

  return (
    <Flex gap={3} wrap="wrap" align="center">
      {hasLine && (
        <Flex gap={1} align="center">
          <Swatch>
            <line x1={0} y1={5} x2={16} y2={5} stroke={color} strokeWidth={2} />
          </Swatch>
          <Text size={0} muted>
            median (p50)
          </Text>
        </Flex>
      )}
      {hasBand && (
        <Flex gap={1} align="center">
          <Swatch>
            <rect x={1} y={1} width={14} height={8} rx={2} fill={COLOR.band} />
          </Swatch>
          <Text size={0} muted>
            p75–p90 spread
          </Text>
        </Flex>
      )}
      <Flex gap={1} align="center">
        <Swatch>
          <circle cx={8} cy={5} r={3} fill={color} />
        </Swatch>
        <Text size={0} muted>
          one run — click to open
        </Text>
      </Flex>
      {series.goal === 'lower' && (
        <Text size={0} muted>
          · lower is better
        </Text>
      )}
    </Flex>
  )
}
