import {Card} from '@sanity/ui'
import {AxisBottom, AxisLeft} from '@visx/axis'
import {Group} from '@visx/group'
import {scaleLinear, scaleTime} from '@visx/scale'
import {LinePath} from '@visx/shape'
import {useState} from 'react'
import {Text, VStack} from 'ui5'

import {resolveTagPositions, type TrendTag} from './data'
import {
  DAY_MS,
  formatCommitDate,
  formatScore,
  nearestPointIndex,
  type SqrlPoint,
  SQRL_REFERENCE_SCORE,
} from './sqrl'
import {COLOR, ReleaseMarkers} from './TrendChart'

const MARGIN = {top: 12, right: 8, bottom: 26, left: 36}

export function SqrlChart(props: {
  points: SqrlPoint[]
  tags: TrendTag[]
  width: number
  height: number
}) {
  const {points, tags, width, height} = props
  const [hoverMs, setHoverMs] = useState<number | null>(null)
  if (width < 10 || points.length === 0) return null

  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const times = points.map((point) => point.ms)
  const rawMin = Math.min(...times)
  const rawMax = Math.max(...times)
  const [minMs, maxMs] = rawMin === rawMax ? [rawMin - DAY_MS, rawMax + DAY_MS] : [rawMin, rawMax]
  const xScale = scaleTime({domain: [new Date(minMs), new Date(maxMs)], range: [0, innerWidth]})

  const values = points.flatMap((point) => [point.score, point.scoreCommit])
  const lowest = Math.min(...values, SQRL_REFERENCE_SCORE)
  const highest = Math.max(...values, SQRL_REFERENCE_SCORE)
  const padding = Math.max((highest - lowest) * 0.1, 1)
  const yScale = scaleLinear({
    domain: [lowest - padding, highest + padding],
    range: [innerHeight, 0],
    nice: true,
  })

  const visibleTags = resolveTagPositions(tags, [], minMs, maxMs)
  const hovered = hoverMs === null ? null : points[nearestPointIndex(points, hoverMs)]
  const hoveredX = hovered ? xScale(new Date(hovered.ms)) : 0
  const flipTooltip = hoveredX + MARGIN.left > width / 2

  return (
    <div style={{position: 'relative', width, height}}>
      <svg width={width} height={height}>
        <title>{`SQRL over time: ${points.length} commits, from ${formatScore(points[0].score)} to ${formatScore(points[points.length - 1].score)}.`}</title>
        <Group left={MARGIN.left} top={MARGIN.top}>
          <line
            x1={0}
            x2={innerWidth}
            y1={yScale(SQRL_REFERENCE_SCORE)}
            y2={yScale(SQRL_REFERENCE_SCORE)}
            stroke={COLOR.axis}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <ReleaseMarkers tags={visibleTags} xScale={(ms) => xScale(new Date(ms))} />
          {points.map((point) => (
            <circle
              key={point.sha}
              cx={xScale(new Date(point.ms))}
              cy={yScale(point.scoreCommit)}
              r={1.8}
              fill={COLOR.line}
              opacity={0.3}
              pointerEvents="none"
            />
          ))}
          {points.length > 1 ? (
            <LinePath<SqrlPoint>
              data={points}
              x={(point) => xScale(new Date(point.ms))}
              y={(point) => yScale(point.score)}
              stroke={COLOR.line}
              strokeWidth={2}
            />
          ) : (
            <circle
              cx={xScale(new Date(points[0].ms))}
              cy={yScale(points[0].score)}
              r={3}
              fill={COLOR.line}
            />
          )}
          {hovered && (
            <>
              <line
                x1={hoveredX}
                x2={hoveredX}
                y1={0}
                y2={innerHeight}
                stroke={COLOR.axis}
                strokeWidth={1}
                opacity={0.7}
                pointerEvents="none"
              />
              <circle
                cx={hoveredX}
                cy={yScale(hovered.score)}
                r={3.5}
                fill={COLOR.line}
                pointerEvents="none"
              />
            </>
          )}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={Math.min(5, points.length)}
            stroke={COLOR.axis}
            tickStroke={COLOR.axis}
            tickLabelProps={{fill: COLOR.axis, fontSize: 10, textAnchor: 'middle'}}
          />
          <AxisLeft
            scale={yScale}
            numTicks={4}
            stroke={COLOR.axis}
            tickStroke={COLOR.axis}
            tickFormat={(value) => String(Math.round(Number(value)))}
            tickLabelProps={{fill: COLOR.axis, fontSize: 10, textAnchor: 'end', dx: -2, dy: 3}}
          />
          <rect
            width={Math.max(0, innerWidth)}
            height={Math.max(0, innerHeight)}
            fill="transparent"
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              setHoverMs(xScale.invert(event.clientX - rect.left).getTime())
            }}
            onPointerLeave={() => setHoverMs(null)}
          />
        </Group>
      </svg>
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: flipTooltip ? undefined : hoveredX + MARGIN.left + 8,
            right: flipTooltip ? width - (hoveredX + MARGIN.left) + 8 : undefined,
            pointerEvents: 'none',
          }}
        >
          <Card radius={2} shadow={2} padding={2}>
            <VStack gap={1}>
              <Text size={0} weight="semibold" as="div" trim={true}>
                SQRL {formatScore(hovered.score)}
              </Text>
              <Text size={0} muted as="div" trim={true}>
                This commit {formatScore(hovered.scoreCommit)}
              </Text>
              <Text size={0} muted as="div" trim={true}>
                {hovered.sha.slice(0, 7)} · {formatCommitDate(hovered.ms)}
              </Text>
            </VStack>
          </Card>
        </div>
      )}
    </div>
  )
}
