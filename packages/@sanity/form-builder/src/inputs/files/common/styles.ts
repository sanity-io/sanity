import styled, {css} from 'styled-components'
import {Card, Flex, Theme} from '@sanity/ui'
import {fileTarget} from '../../common/fileTarget'

export type {FileInfo} from '../../common/fileTarget'
export const FileTarget = fileTarget(Card)

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
