import styled, {css} from 'styled-components'
import {Flex, Theme} from '@sanity/ui'
import React from 'react'

// todo:
//  This is a workaround for TS4023: Exported variable 'AssetBackground' has or is using name 'FlexProps'
//  Can be deleted when @sanity/ui exports FlexProps
type Workaround = React.ComponentType<React.ComponentProps<typeof Flex>>

export const AssetBackground: Workaround = styled(Flex)((props: {theme: Theme}) => {
  const {theme} = props
  const {media} = theme.sanity
  return css`
    height: 25rem;
    @media screen and (max-width: ${media[0]}px) {
      height: 10rem;
    }
    @media screen and (max-width: ${media[1]}px) {
      height: 20rem;
    }
  `
})
