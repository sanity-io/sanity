import {AxisBottom, AxisLeft} from '@visx/axis'
import {Group} from '@visx/group'
import {scaleLinear, scaleTime} from '@visx/scale'
import {Area, LinePath} from '@visx/shape'
import {useIntentLink} from 'sanity/router'

import {formatValue, type TrendPoint, type TrendSeries} from './data'

const MARGIN = {top: 8, right: 8, bottom: 22, left: 44}

/** Theme-aware colors via the studio's CSS custom properties. */
const COLOR = {
  line: 'var(--card-accent-fg-color, #556bfc)',
  band: 'var(--card-badge-primary-bg-color, rgba(85, 107, 252, 0.15))',
  axis: 'var(--card-muted-fg-color, #727892)',
}

/** A dot linking to the run document behind the sample. */
function RunDot(props: {point: TrendPoint; cx: number; cy: number}) {
  const {point, cx, cy} = props
  const intent = useIntentLink({
    intent: 'edit',
    params: {id: point.runId, type: 'benchRun'},
  })
  return (
    <a
      href={intent.href}
      onClick={intent.onClick}
      aria-label={`open run ${point.sha.slice(0, 10)}`}
    >
      <circle cx={cx} cy={cy} r={3} fill={COLOR.line}>
        <title>{`${point.date.toISOString().slice(0, 10)} @ ${point.sha.slice(0, 10)} — ${formatValue(point.value, 'ms')}`}</title>
      </circle>
    </a>
  )
}

export function TrendChart(props: {series: TrendSeries; width: number; height: number}) {
  const {series, width, height} = props
  const {points, unit} = series
  if (width < 10 || points.length === 0) return null

  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const dates = points.map((point) => point.date.getTime())
  let [minDate, maxDate] = [Math.min(...dates), Math.max(...dates)]
  if (minDate === maxDate) {
    // A single run so far: pad the domain so the point renders mid-chart
    minDate -= 24 * 60 * 60 * 1000
    maxDate += 24 * 60 * 60 * 1000
  }
  const xScale = scaleTime({domain: [new Date(minDate), new Date(maxDate)], range: [0, innerWidth]})
  const maxValue = Math.max(...points.map((point) => point.p90 ?? point.value))
  const yScale = scaleLinear({
    domain: [0, maxValue > 0 ? maxValue * 1.1 : 1],
    range: [innerHeight, 0],
    nice: true,
  })

  const x = (point: TrendPoint) => xScale(point.date)
  const hasBand = points.some((point) => point.p75 !== undefined && point.p90 !== undefined)

  return (
    <svg width={width} height={height} role="img" aria-label={series.title}>
      <Group left={MARGIN.left} top={MARGIN.top}>
        {hasBand && points.length > 1 && (
          <Area<TrendPoint>
            data={points}
            x={x}
            y0={(point) => yScale(point.p75 ?? point.value)}
            y1={(point) => yScale(point.p90 ?? point.value)}
            fill={COLOR.band}
          />
        )}
        {points.length > 1 && (
          <LinePath<TrendPoint>
            data={points}
            x={x}
            y={(point) => yScale(point.value)}
            stroke={COLOR.line}
            strokeWidth={1.5}
          />
        )}
        {points.map((point) => (
          <RunDot key={point.runId} point={point} cx={x(point)} cy={yScale(point.value)} />
        ))}
        <AxisBottom
          top={innerHeight}
          scale={xScale}
          numTicks={Math.min(4, points.length)}
          stroke={COLOR.axis}
          tickStroke={COLOR.axis}
          tickLabelProps={{fill: COLOR.axis, fontSize: 10, textAnchor: 'middle'}}
        />
        <AxisLeft
          scale={yScale}
          numTicks={3}
          stroke={COLOR.axis}
          tickStroke={COLOR.axis}
          tickFormat={(value) => formatValue(Number(value), unit)}
          tickLabelProps={{fill: COLOR.axis, fontSize: 10, textAnchor: 'end', dx: -2, dy: 3}}
        />
      </Group>
    </svg>
  )
}
