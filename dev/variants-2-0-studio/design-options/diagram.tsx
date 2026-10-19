import type {DiagramSpec} from './types'

// A 200 x 100 wire schematic of an app (top bar, list column, document pane), drawn from a DiagramSpec. The part
// an option changes is drawn in the variant purple (35% fill, 1px stroke); everything else is a quiet wire.
// Theme tokens only, so light and dark both work.

const WIRE = 'var(--card-border-color)'
const FAINT = 'var(--card-muted-fg-color)'
const PURPLE = 'var(--card-badge-suggest-dot-color)'

function Frame({inspector}: {inspector?: boolean}) {
  const paneRight = inspector ? 142 : 196
  return (
    <>
      <rect fill="none" height={99} rx={3} stroke={WIRE} width={199} x={0.5} y={0.5} />
      <line stroke={WIRE} x1={0} x2={200} y1={12} y2={12} />
      <rect fill={FAINT} fillOpacity={0.4} height={4} rx={2} width={22} x={6} y={4} />
      <line stroke={WIRE} x1={52} x2={52} y1={12} y2={100} />
      {[20, 34, 48, 62, 76].map((y) => (
        <rect fill={FAINT} fillOpacity={0.25} height={8} key={y} rx={2} width={30} x={6} y={y} />
      ))}
      <line stroke={WIRE} x1={52} x2={paneRight} y1={24} y2={24} />
      <rect fill={FAINT} fillOpacity={0.4} height={5} rx={2} width={46} x={60} y={32} />
      {[44, 58, 72].map((y) => (
        <rect fill="none" height={9} key={y} rx={2} stroke={WIRE} width={paneRight - 66} x={60} y={y} />
      ))}
      {inspector ? <line stroke={WIRE} x1={paneRight + 2} x2={paneRight + 2} y1={12} y2={100} /> : null}
    </>
  )
}

/** The 200 x 100 diagram for one option. */
export function OptionDiagram({spec}: {spec?: DiagramSpec}) {
  const dashed = !spec || spec.dashed
  return (
    <svg aria-hidden="true" height={100} style={{display: 'block'}} viewBox="0 0 200 100" width={200}>
      <Frame inspector={spec?.frame === 'inspector'} />
      {dashed ? (
        <rect fill="none" height={72} rx={3} stroke={FAINT} strokeDasharray="4 3" width={140} x={56} y={16} />
      ) : (
        spec?.shapes?.map((shape, i) =>
          shape.kind === 'dot' ? (
            <circle cx={shape.x} cy={shape.y} fill={PURPLE} fillOpacity={0.6} key={i} r={shape.w ?? 2.5} stroke={PURPLE} strokeWidth={1} />
          ) : (
            <rect
              fill={PURPLE}
              fillOpacity={0.35}
              height={shape.h ?? 6}
              key={i}
              rx={shape.kind === 'pill' ? (shape.h ?? 6) / 2 : 2}
              stroke={PURPLE}
              strokeWidth={1}
              width={shape.w ?? 10}
              x={shape.x}
              y={shape.y}
            />
          ),
        )
      )}
    </svg>
  )
}
