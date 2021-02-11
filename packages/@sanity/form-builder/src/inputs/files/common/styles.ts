import styled, {css} from 'styled-components'
import {Card, rem, Theme} from '@sanity/ui'
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
