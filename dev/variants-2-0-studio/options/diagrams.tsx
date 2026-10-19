import type {ReactNode} from 'react'

// A 200 x 100 wire schematic of the studio: top bar, list column, document pane. The part that an option
// changes is drawn in the variant purple (35% fill, 1px stroke); everything else is a quiet wire.
// Theme tokens only, so light and dark both work.

const WIRE = 'var(--card-border-color)'
const FAINT = 'var(--card-muted-fg-color)'
const PURPLE = 'var(--card-badge-suggest-dot-color)'

function Hl(props: {x: number; y: number; w: number; h: number; r?: number}) {
  return (
    <rect
      fill={PURPLE}
      fillOpacity={0.35}
      height={props.h}
      rx={props.r ?? 2}
      stroke={PURPLE}
      strokeWidth={1}
      width={props.w}
      x={props.x}
      y={props.y}
    />
  )
}

function Pill(props: {x: number; y: number; w: number; h?: number}) {
  const h = props.h ?? 6
  return <Hl h={h} r={h / 2} w={props.w} x={props.x} y={props.y} />
}

function Dot(props: {x: number; y: number}) {
  return <circle cx={props.x} cy={props.y} fill={PURPLE} fillOpacity={0.6} r={2.5} stroke={PURPLE} strokeWidth={1} />
}

/** The studio wire frame. `narrowPane` makes room for a right-hand inspector. */
function Frame({children, narrowPane}: {children?: ReactNode; narrowPane?: boolean}) {
  const paneRight = narrowPane ? 142 : 196
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
      {narrowPane ? <line stroke={WIRE} x1={paneRight + 2} x2={paneRight + 2} y1={12} y2={100} /> : null}
      {children}
    </>
  )
}

/** A dashed outline: the option is not drawn yet. */
function NotDrawn() {
  return (
    <>
      <Frame />
      <rect
        fill="none"
        height={72}
        rx={3}
        stroke={FAINT}
        strokeDasharray="4 3"
        width={140}
        x={56}
        y={16}
      />
    </>
  )
}

function C1({option}: {option: string}) {
  if (option === 'b') {
    return (
      <Frame>
        <Pill w={16} x={140} y={3} />
        <Pill w={16} x={160} y={3} />
        <Hl h={42} w={92} x={100} y={14} />
      </Frame>
    )
  }
  return (
    <Frame>
      <Pill w={26} x={160} y={3} />
      <Hl h={8} w={198} x={1} y={13} r={0} />
    </Frame>
  )
}

function C2({option}: {option: string}) {
  if (option === 'b') {
    return (
      <Frame>
        <Hl h={7} w={40} x={60} y={14.5} />
        <Hl h={7} w={40} x={104} y={14.5} />
      </Frame>
    )
  }
  return (
    <Frame>
      {[60, 88, 116, 144].map((x) => (
        <Pill h={7} key={x} w={24} x={x} y={14.5} />
      ))}
    </Frame>
  )
}

function C3({option}: {option: string}) {
  const rows = [24, 38, 52, 66, 80]
  if (option === 'c') {
    return (
      <Frame>
        {rows.map((y) => (
          <Dot key={y} x={44} y={y + 4} />
        ))}
      </Frame>
    )
  }
  return (
    <Frame>
      {rows.map((y) => (
        <Hl h={7} key={y} r={2} w={7} x={40} y={y + 0.5} />
      ))}
      {option === 'b' ? (
        <>
          <Hl h={26} w={34} x={30} y={34} />
          <Hl h={20} w={30} x={66} y={34} />
        </>
      ) : (
        <Hl h={22} w={42} x={30} y={34} />
      )}
    </Frame>
  )
}

function C4({option}: {option: string}) {
  if (option === 'b') {
    return (
      <Frame>
        <Hl h={44} w={60} x={100} y={20} />
      </Frame>
    )
  }
  return (
    <Frame narrowPane>
      <Hl h={87} r={0} w={55} x={144} y={12.5} />
    </Frame>
  )
}

function C7({option}: {option: string}) {
  if (option === 'b') {
    return (
      <Frame>
        <Hl h={5} w={60} x={130} y={14.5} />
      </Frame>
    )
  }
  return (
    <Frame>
      <Hl h={10} r={0} w={143} x={53} y={25} />
    </Frame>
  )
}

/** The 200 x 100 diagram for one option of one component. */
export function OptionDiagram(props: {component: string; option: string; notDrawn?: boolean}) {
  const {component, option, notDrawn} = props
  let body: ReactNode
  if (notDrawn || component === 'c5' || component === 'c6' || component === 'c8') body = <NotDrawn />
  else if (component === 'c1') body = <C1 option={option} />
  else if (component === 'c2') body = <C2 option={option} />
  else if (component === 'c3') body = <C3 option={option} />
  else if (component === 'c4') body = <C4 option={option} />
  else if (component === 'c7') body = <C7 option={option} />
  else body = <NotDrawn />

  return (
    <svg aria-hidden="true" height={100} style={{display: 'block'}} viewBox="0 0 200 100" width={200}>
      {body}
    </svg>
  )
}
