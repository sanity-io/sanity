import {Flex, Text} from '@sanity/ui'

import {type TrendSeries} from './data'
import {baselineDetail, baselineLabel, type DriftResult} from './drift'
import {ALL_LAYERS_VISIBLE, type Layer, type LayerState} from './layers'
import {categoricalColor} from './palette'
import {baselineToDraw, COLOR, seriesHasBand} from './TrendChart'

function Swatch(props: {children: React.ReactNode; dimmed?: boolean}) {
  return (
    <svg
      width={16}
      height={10}
      aria-hidden="true"
      style={{flexShrink: 0, opacity: props.dimmed ? 0.35 : 1}}
    >
      {props.children}
    </svg>
  )
}

/**
 * One legend entry. A toggleable layer renders as a button (click to hide/show
 * it across the whole grid); a non-toggleable key — branch colors, the "lower is
 * better" note — stays plain text, so only the things that actually respond to a
 * click look clickable.
 */
function LegendItem(props: {
  layer?: Layer
  layers: LayerState
  label: string
  /** The arithmetic behind the label, surfaced on hover. */
  hint?: string
  swatch: React.ReactNode
}) {
  const {layer, layers, label, hint, swatch} = props
  const hidden = layer ? !layers.visible(layer) : false
  const content = (
    <Flex gap={1} align="center">
      <Swatch dimmed={hidden}>{swatch}</Swatch>
      <Text size={0} muted style={hidden ? {textDecoration: 'line-through'} : undefined}>
        {label}
      </Text>
    </Flex>
  )
  if (!layer) return content
  return (
    <button
      type="button"
      onClick={() => layers.toggle(layer)}
      aria-pressed={!hidden}
      title={[hint, hidden ? `Show ${label} on all charts` : `Hide ${label} on all charts`]
        .filter(Boolean)
        .join(' — ')}
      style={{
        background: 'none',
        border: 0,
        padding: 0,
        margin: 0,
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
      }}
    >
      {content}
    </button>
  )
}

/**
 * Encoding key rendered under every chart, doubling as the layer switchboard:
 * clicking an entry shows/hides that layer on every chart (see layers.ts for
 * why the toggle is global rather than per-card). Comparing branches, it becomes
 * the branch color key — identity by color needs a legend, never color alone.
 */
export function ChartLegend(props: {
  series: TrendSeries
  drift?: DriftResult
  layers?: LayerState
}) {
  const {series, drift, layers = ALL_LAYERS_VISIBLE} = props
  const comparing = series.lines.length > 1
  // Whether this chart *has* a baseline to explain — independent of whether the
  // layer is currently visible, so toggling it off doesn't remove the control
  // that toggles it back on
  const overlayBaseline = baselineToDraw(series, drift)

  const overlayColor =
    drift?.direction === 'regression'
      ? COLOR.baselineRegression
      : drift?.direction === 'improvement'
        ? COLOR.baselineImprovement
        : COLOR.baselineNeutral

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
  // Same predicate the plot uses, so the legend can't offer a band that isn't
  // drawn (low-sample metrics collapse the band to a line — see seriesHasBand)
  const hasBand = line && line.points.length > 1 && seriesHasBand(series)
  const hasLine = line && line.points.length > 1

  return (
    <Flex gap={3} wrap="wrap" align="center">
      {hasLine && (
        <LegendItem
          layer="median"
          layers={layers}
          label={series.goal === 'context' ? 'reference' : 'median (p50)'}
          swatch={
            <line
              x1={0}
              y1={5}
              x2={16}
              y2={5}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={series.goal === 'context' ? '3 2' : undefined}
            />
          }
        />
      )}
      {hasBand && (
        <LegendItem
          layer="band"
          layers={layers}
          label="p75–p90 spread"
          swatch={
            // Same construction as the plot: translucent fill with defined
            // edges, in the series color
            <>
              <rect x={0} y={2} width={16} height={6} fill={color} opacity={0.22} />
              <line x1={0} y1={2} x2={16} y2={2} stroke={color} strokeWidth={1} opacity={0.5} />
              <line x1={0} y1={8} x2={16} y2={8} stroke={color} strokeWidth={1} opacity={0.5} />
            </>
          }
        />
      )}
      {overlayBaseline && (
        <LegendItem
          layer="baseline"
          layers={layers}
          label={`baseline ${baselineLabel(overlayBaseline)}`}
          hint={baselineDetail(overlayBaseline)}
          swatch={
            <>
              {/* Two stacked strokes, dashed over solid — the before/after pair.
                  An explicit step glyph was tried and is illegible at 16×10px. */}
              <line
                x1={0}
                y1={3}
                x2={16}
                y2={3}
                stroke={overlayColor}
                strokeWidth={1.5}
                strokeDasharray="3 2"
                opacity={0.55}
              />
              <line
                x1={0}
                y1={8}
                x2={16}
                y2={8}
                stroke={overlayColor}
                strokeWidth={2}
                opacity={0.9}
              />
            </>
          }
        />
      )}
      {series.goal === 'lower' && (
        <Text size={0} muted>
          lower is better
        </Text>
      )}
    </Flex>
  )
}
