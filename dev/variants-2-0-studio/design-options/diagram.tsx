import type {CSSProperties} from 'react'

import type {DiagramEntry, DiagramPrim, DiagramSpec} from './types'

// Option diagrams. Two forms:
//  - `OptionDiagram`: a 200 x 100 wire schematic of an app (top bar, list column, document pane), drawn from a
//    DiagramSpec. The part an option changes is drawn in the variant purple; everything else is a quiet wire.
//  - `SpecDiagram`: a diagram of the shared spec (options/diagrams.json, also read by the design tracker): a list of
//    named primitives on a 320 x 170 grid (flows 320 x 64). The same file renders the tracker; keep the geometry in
//    step with it.
// Theme tokens only, so light and dark both work. Both scale to the width of their container.

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

const SCALE: CSSProperties = {display: 'block', height: 'auto', maxWidth: '100%', width: '100%'}

/** The 200 x 100 diagram for one option. */
export function OptionDiagram({spec}: {spec?: DiagramSpec}) {
  const dashed = !spec || spec.dashed
  return (
    <svg aria-hidden="true" style={SCALE} viewBox="0 0 200 100">
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

// ---- spec diagrams

const FILL: Record<string, string> = {
  bar: 'var(--card-border-color)',
  border: 'var(--card-border-color)',
  faint: 'var(--card-muted-fg-color)',
  bg: 'var(--card-bg-color)',
  violet: PURPLE,
  blue: 'var(--card-badge-primary-dot-color)',
  red: 'var(--card-badge-critical-dot-color)',
  brand: 'var(--card-badge-caution-dot-color)',
  check: 'var(--card-badge-primary-dot-color)',
  black: '#000',
  none: 'none',
}
const CHIP: Record<string, [string, number]> = {n: [FILL.faint, 0.35], v: [FILL.violet, 0.45], r: [FILL.blue, 0.45], g: [FILL.faint, 0.2]}

interface RectArgs {
  x: number
  y: number
  w: number
  h: number
  fill?: string
  stroke?: string
  rx?: number
  op?: number
  dash?: string
}

function R({x, y, w, h, fill = 'bar', stroke, rx = 1.5, op, dash}: RectArgs) {
  return (
    <rect
      fill={FILL[fill]}
      fillOpacity={op}
      height={h}
      rx={rx}
      stroke={stroke ? FILL[stroke] : undefined}
      strokeDasharray={dash}
      strokeWidth={stroke ? 0.6 : undefined}
      width={w}
      x={x}
      y={y}
    />
  )
}
const Bar = ({x, y, w, h = 3, op}: {x: number; y: number; w: number; h?: number; op?: number}) => <R h={h} op={op} w={w} x={x} y={y} />
const Chip = ({x, y, w, kind = 'n'}: {x: number; y: number; w: number; kind?: string}) => (
  <rect fill={CHIP[kind][0]} fillOpacity={CHIP[kind][1]} height={5} rx={1.5} width={w} x={x} y={y} />
)

function Nav({active = 3}: {active?: number}) {
  return (
    <>
      <R h={13} rx={0} w={320} x={0} y={0} />
      <R fill="brand" h={5} op={0.8} w={8} x={6} y={4} />
      {[0, 1, 2, 3, 4].map((i) => (
        <R fill={i === active ? 'violet' : 'faint'} h={6} key={i} op={i === active ? 0.55 : 0.35} rx={2} w={22} x={108 + i * 27} y={3.5} />
      ))}
      <R h={5} rx={3} w={8} x={296} y={4} />
      <R h={5} rx={3} w={6} x={308} y={4} />
    </>
  )
}

function Lens({active = 0, picker = true}: {active?: number; picker?: boolean}) {
  return (
    <>
      <Bar h={3.5} w={24} x={8} y={22} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <R fill={i === active ? 'violet' : 'bar'} h={9} op={i === active ? 0.5 : undefined} rx={2} w={28} x={38 + i * 31} y={18} />
          <Bar h={2.2} op={0.9} w={18} x={43 + i * 31} y={21.5} />
        </g>
      ))}
      {picker ? (
        <>
          <R h={9} rx={2} w={74} x={238} y={18} />
          <Bar h={2.2} w={46} x={243} y={21.5} />
        </>
      ) : null}
    </>
  )
}

function Tabs({y, n = 3, search = true, btn}: {y: number; n?: number; search?: boolean; btn?: string}) {
  return (
    <>
      {Array.from({length: n}, (_, i) => (
        <R fill={i === 0 ? 'violet' : 'bar'} h={8} key={i} op={i === 0 ? 0.4 : undefined} rx={2} w={26} x={14 + i * 30} y={y} />
      ))}
      {search ? (
        <>
          <R fill="none" h={8} rx={2} stroke="border" w={66} x={196} y={y} />
          <Bar h={2} w={34} x={210} y={y + 3} />
        </>
      ) : null}
      {btn ? (
        <>
          <R fill={btn === 'b' ? 'blue' : 'bar'} h={8} op={0.85} rx={2} w={40} x={268} y={y} />
          <Bar h={2} op={0.9} w={28} x={274} y={y + 3} />
        </>
      ) : (
        <>
          <R h={6} rx={3} w={6} x={268} y={y + 1} />
          <R h={6} rx={3} w={6} x={278} y={y + 1} />
        </>
      )}
    </>
  )
}

function Row({y, cells, grey, checked, h = 14}: {y: number; cells: [number, number, string][]; grey?: boolean; checked?: boolean; h?: number}) {
  const op = grey ? 0.35 : 0.9
  return (
    <>
      {checked ? <R fill="violet" h={h} op={0.12} rx={0} w={304} x={8} y={y} /> : null}
      <R fill="border" h={0.4} rx={0} w={304} x={8} y={y + h} />
      <R fill={checked ? 'check' : 'none'} h={6} rx={1} stroke="faint" w={6} x={13} y={y + 4} />
      <R dash="1.5 1" fill="none" h={9} stroke="faint" w={9} x={23} y={y + 2.5} />
      <Bar op={op} w={50} x={36} y={y + 3.5} />
      <Bar h={2.2} op={0.4} w={30} x={36} y={y + 8.5} />
      {cells.map(([x, w, k], i) =>
        k === 't' ? (
          <Bar h={2.4} key={i} op={0.5} w={w} x={x} y={y + 5.5} />
        ) : k === 'dot' ? (
          <g key={i}>
            <R fill="violet" h={7} op={0.5} rx={3.5} w={7} x={x} y={y + 3.5} />
            <Bar h={2.4} op={0.5} w={w - 10} x={x + 10} y={y + 5.5} />
          </g>
        ) : (
          <Chip key={i} kind={grey ? 'g' : k} w={w} x={x} y={y + 4.5} />
        ),
      )}
      <R h={2} rx={1} w={2} x={300} y={y + 6} />
      <R h={2} rx={1} w={2} x={304} y={y + 6} />
    </>
  )
}

const DIALOG_LINES: [number, number][] = [
  [22, 86],
  [24, 100],
  [28, 70],
  [34, 100],
]

function Prim({prim, flowIndex, flowCount, width}: {prim: DiagramPrim; flowIndex: number; flowCount: number; width: number}) {
  const a = prim
  switch (a.p) {
    case 'nav':
      return <Nav active={a.active} />
    case 'lens':
      return <Lens active={a.active} picker={a.picker !== false} />
    case 'card':
    case 'pane':
      return <R fill="none" h={a.h} rx={a.rx ?? 2} stroke={a.stroke ?? 'border'} w={a.w} x={a.x} y={a.y} />
    case 'title':
      return (
        <>
          <Bar h={5} op={0.95} w={a.w ?? 70} x={14} y={a.y} />
          <Bar h={2.4} op={0.5} w={(a.w ?? 70) + 50} x={14} y={a.y + 9} />
        </>
      )
    case 'tabs':
      return <Tabs btn={a.btn} n={a.n} search={a.search !== false} y={a.y} />
    case 'head':
      return (
        <>
          <R h={10} op={0.55} rx={0} w={300} x={(a.x0 ?? 14) - 6} y={a.y - 3} />
          {(a.cols as [number, number][]).map(([x, w], i) => (
            <Bar h={2.6} key={i} op={0.9} w={w} x={x} y={a.y} />
          ))}
        </>
      )
    case 'row':
      return <Row cells={a.cells} checked={a.checked} grey={a.grey} h={a.h} y={a.y} />
    case 'selectionBar':
      return (
        <>
          <R fill="violet" h={11} op={0.14} rx={0} w={302} x={9} y={57} />
          <Bar op={0.8} w={26} x={14} y={61} />
          <Bar h={2.6} op={0.6} w={14} x={46} y={61} />
          <Bar h={2.6} op={0.6} w={40} x={196} y={61} />
          <R fill="blue" h={8} op={0.85} rx={2} w={54} x={254} y={58.5} />
          <Bar h={2.2} op={0.9} w={44} x={259} y={61.5} />
        </>
      )
    case 'dialog':
      return (
        <>
          <R fill="black" h={170} op={0.45} rx={0} w={320} x={0} y={0} />
          <R fill="bg" h={102} rx={4} stroke="border" w={148} x={86} y={34} />
          <Bar h={4} op={0.95} w={64} x={94} y={42} />
          {DIALOG_LINES.map(([lw, vw], i) => (
            <g key={i}>
              <Bar h={2.6} op={0.9} w={lw} x={94} y={56 + i * 14} />
              <Bar h={2.4} op={0.5} w={vw} x={124} y={56 + i * 14} />
              {i === 1 || i === 3 ? <Bar h={2.4} op={0.5} w={vw * 0.6} x={124} y={60 + i * 14} /> : null}
            </g>
          ))}
          <R h={10} rx={2} w={28} x={166} y={118} />
          <R fill="red" h={10} op={0.8} rx={2} w={28} x={198} y={118} />
        </>
      )
    case 'box':
      return <R dash={a.dash} fill={a.fill} h={a.h} op={a.op} rx={a.rx} stroke={a.stroke} w={a.w} x={a.x} y={a.y} />
    case 'bar':
      return <Bar h={a.h} op={a.op} w={a.w} x={a.x} y={a.y} />
    case 'chip':
      return <Chip kind={a.kind} w={a.w} x={a.x} y={a.y} />
    case 'label':
      return (
        <text fill="var(--card-muted-fg-color)" fontFamily="inherit" fontSize={7} x={a.x} y={a.y}>
          {a.text}
        </text>
      )
    case 'flowBox': {
      const bw = (width - 16 - (flowCount - 1) * 14) / flowCount
      const x = 8 + flowIndex * (bw + 14)
      const words = String(a.label).split(' ')
      const half = Math.floor(words.length / 2) || 1
      const lines = String(a.label).length <= 11 ? [String(a.label)] : [words.slice(0, half).join(' '), words.slice(half).join(' ')].filter(Boolean)
      const y0 = 32 - (lines.length - 1) * 5
      const kind = a.kind === 'v' ? 'violet' : a.kind === 'r' ? 'blue' : 'bar'
      return (
        <>
          <R fill={kind} h={44} op={kind === 'bar' ? undefined : 0.22} rx={3} stroke="border" w={bw} x={x} y={10} />
          {lines.map((l, j) => (
            <text fill="var(--card-fg-color)" fontFamily="inherit" fontSize={8} key={j} textAnchor="middle" x={x + bw / 2} y={y0 + j * 10}>
              {l}
            </text>
          ))}
          {flowIndex < flowCount - 1 ? (
            <path d={`M${x + bw + 2} 32 H${x + bw + 12} m-3 -3 l3 3 l-3 3`} fill="none" stroke={FAINT} strokeWidth={1} />
          ) : null}
        </>
      )
    }
    default:
      return null
  }
}

/** A diagram of the shared spec, scaled to the width of its container. */
export function SpecDiagram({entry}: {entry: DiagramEntry}) {
  if (entry.generic) return <OptionDiagram spec={entry.generic} />
  const [w, h] = entry.size
  const prims = entry.prims ?? []
  const flowCount = prims.filter((p) => p.p === 'flowBox').length
  let flowIndex = -1
  return (
    <svg aria-hidden="true" data-testid="spec-diagram" style={SCALE} viewBox={`0 0 ${w} ${h}`}>
      <rect fill={FILL.bg} height={h - 1} stroke={FILL.border} strokeWidth={0.6} width={w - 1} x={0.5} y={0.5} />
      {prims.map((prim, i) => {
        if (prim.p === 'flowBox') flowIndex += 1
        return <Prim flowCount={flowCount} flowIndex={flowIndex} key={i} prim={prim} width={w} />
      })}
    </svg>
  )
}
