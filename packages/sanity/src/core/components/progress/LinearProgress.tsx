import {hues} from '@sanity/color'
import {Theme, Card} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'

const STROKE_WIDTH = 0.5

const Root = styled(Card)`
  overflow: hidden;
`

const Bar = styled(Card)(({theme}: {theme: Theme}) => {
  const {color} = theme.sanity

  return css`
    height: ${STROKE_WIDTH}rem;
    background: ${hues.blue[color.dark ? 400 : 500].hex};
    transition: transform 75ms;
  `
})

/** @beta */
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
