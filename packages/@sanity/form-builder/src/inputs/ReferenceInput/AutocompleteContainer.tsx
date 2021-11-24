import {Grid, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import React from 'react'
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
export function AutocompleteContainer(props: {children: ReactNode}) {
  return <Root gap={1}>{props.children}</Root>
}
