import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

const SIZE = 43
const STROKE_WIDTH = 3

const Root = styled.svg`
  width: ${SIZE}px;
  height: ${SIZE}px;
  transform: rotate(-90deg);
`

const BgCircle = styled.circle`
  fill: none;
  stroke: ${vars.color.tinted.default.border[0]};
  stroke-width: ${STROKE_WIDTH}px;
`

const ProgressCircle = styled.circle`
  fill: none;
  stroke: ${vars.color.solid.primary.bg[0]};
  stroke-width: ${STROKE_WIDTH}px;
  transition: stroke-dashoffset 75ms;
`

/**
 * @hidden
 * @beta */
export function CircularProgress(props: {
  /** Percentage */
  value: number
}) {
  const {value: valueProp} = props
  const value = Math.min(Math.max(valueProp, 0), 100)
  const radius = SIZE / 2 - STROKE_WIDTH / 2
  const circ = 2 * Math.PI * radius
  const offset = ((100 - value) / 100) * circ
  const viewBox = `${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`

  return (
    <Root viewBox={viewBox}>
      <BgCircle cx={SIZE} cy={SIZE} r={radius} />
      <ProgressCircle
        cx={SIZE}
        cy={SIZE}
        r={radius}
        style={{
          strokeDasharray: circ,
          strokeDashoffset: `${offset}px`,
        }}
      />
    </Root>
  )
}
