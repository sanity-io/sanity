import {Card} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

const STROKE_WIDTH = 0.5

const Root = styled(Card)`
  overflow: hidden;
  overflow: clip;
`

const Bar = styled(Card)`
  height: ${STROKE_WIDTH}rem;
  background: ${vars.color.solid.primary.bg[0]};
  transition: transform 75ms;
`

/**
 * @hidden
 * @beta */
export function LinearProgress(props: {
  /** Percentage */
  value: number
}) {
  const {value} = props

  return (
    <Root radius={5}>
      <Bar radius={5} style={{transform: `translate3d(${value - 100}%, 0, 0)`}} />
    </Root>
  )
}
