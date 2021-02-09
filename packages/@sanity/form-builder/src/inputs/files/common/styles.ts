import styled, {css} from 'styled-components'
import {Card, Flex, rem, Theme} from '@sanity/ui'
import {fileTarget} from '../../common/fileTarget'
import {focusRingStyle} from './focusringUtils'

export type {FileInfo} from '../../common/fileTarget'

const CardWithFocusRing = styled(Card)(({theme}: {theme: Theme}) => {
  const border = {width: 1, color: 'var(--card-border-color)'}

  return css`
    border-radius: ${rem(theme.sanity.radius[1])};
    outline: none;
    &:focus {
      box-shadow: ${focusRingStyle({
        base: theme.sanity.color.base,
        border,
        focusRing: theme.sanity.focusRing,
      })};
    }
  `
})

export const FileTarget = fileTarget(CardWithFocusRing)

// todo:
//  This is a workaround for TS4023: Exported variable 'AssetBackground' has or is using name 'FlexProps'
//  Can be deleted when @sanity/ui exports FlexProps
type Workaround = React.ComponentType<React.ComponentProps<typeof Flex>>

export const AssetBackground: Workaround = styled(Flex)((props: {theme: Theme}) => {
  const {theme} = props
  const {media} = theme.sanity
  return css`
    min-height: 10rem;
    position: relative;
    @media screen and (min-width: ${media[1]}px) {
      min-height: 12rem;
      max-height: 27rem;
      min-width: 12rem;
      height: auto;
    }
  `
})

export const Overlay: React.ComponentType = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--card-bg-color);
  z-index: 3;
  pointer-events: none;
`
