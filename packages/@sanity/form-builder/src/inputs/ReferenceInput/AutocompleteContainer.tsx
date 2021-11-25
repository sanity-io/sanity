import {Grid, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import React, {ForwardedRef, forwardRef} from 'react'
import type {ReactNode} from 'react'

const Root = styled(Grid)((props: {theme: Theme}) => {
  const {media} = props.theme.sanity
  return css`
    @media screen and (min-width: ${media[0]}px) {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
    @media screen and (min-width: ${media[1]}px) {
      grid-template-columns: 1fr min-content;
    }
  `
})
export const AutocompleteContainer = forwardRef(function AutocompleteContainer(
  props: {
    children: ReactNode
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <Root gap={1} ref={ref}>
      {props.children}
    </Root>
  )
})
