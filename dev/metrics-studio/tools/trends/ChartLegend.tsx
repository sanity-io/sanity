import {Flex, Text} from '@sanity/ui'

import {type TrendSeries} from './data'
import {categoricalColor} from './palette'
import {COLOR} from './TrendChart'

function Swatch(props: {children: React.ReactNode}) {
  return (
    <svg width={16} height={10} aria-hidden="true" style={{flexShrink: 0}}>
      {props.children}
    </svg>
  )
}

/**
 * Encoding key rendered under every chart. With one line it explains the
 * three marks (median / band / dots); comparing branches, it becomes the
 * branch color key — identity by color needs a legend, never color alone.
 */
export function ChartLegend(props: {series: TrendSeries}) {
  const {series} = props
  const comparing = series.lines.length > 1

  if (comparing) {
    return (
      <Flex gap={3} wrap="wrap" align="center">
        {series.lines.map((line, index) => (
          <Flex key={line.branch} gap={1} align="center">
            <Swatch>
              <line x1={0} y1={5} x2={16} y2={5} stroke={categoricalColor(index)} strokeWidth={2} />
            </Swatch>
            <Text size={0} muted>
              {line.branch}
            </Text>
          </Flex>
        ))}
        {series.goal === 'lower' && (
          <Text size={0} muted>
            · lower is better
          </Text>
        )}
      </Flex>
    )
  }

  const line = series.lines[0]
  const color = series.goal === 'context' ? COLOR.context : COLOR.line
  const hasBand =
    line && line.points.length > 1 && line.points.some((point) => point.p75 !== undefined)
  const hasLine = line && line.points.length > 1

  return (
    <Flex gap={3} wrap="wrap" align="center">
      {hasLine && (
        <Flex gap={1} align="center">
          <Swatch>
            <line
              x1={0}
              y1={5}
              x2={16}
              y2={5}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={series.goal === 'context' ? '3 2' : undefined}
            />
          </Swatch>
          <Text size={0} muted>
            {series.goal === 'context' ? 'reference' : 'median (p50)'}
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
      {series.goal === 'lower' && (
        <Text size={0} muted>
          lower is better
        </Text>
      )}
    </Flex>
  )
}
