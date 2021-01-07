import {color as hues} from '@sanity/color'
import {Theme} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'

const STROKE_WIDTH = 3

const Root = styled.div(({theme}: {theme: Theme}) => {
  const {color} = theme.sanity

  return css`
    overflow: hidden;
    background-color: ${hues.gray[color.dark ? 900 : 100].hex};
  `
})

const Bar = styled.div(({theme}: {theme: Theme}) => {
  const {color} = theme.sanity

  return css`
    height: ${STROKE_WIDTH}px;
    background: ${hues.blue[color.dark ? 400 : 500].hex};
    transition: transform 75ms;
  `
})

export function LinearProgress(props: {value: number}) {
  const {value} = props

  return (
    <Root>
      <Bar style={{transform: `translate3d(${value - 100}%, 0, 0)`}} />
    </Root>
  )
}
