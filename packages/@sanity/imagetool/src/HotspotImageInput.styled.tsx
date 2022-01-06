import {studioTheme, rgba, Card, Flex} from '@sanity/ui'
import styled from 'styled-components'

export const MAX_HEIGHT = '15rem'

export const RatioBox = styled(Card)`
  position: relative;
  width: 100%;
  resize: vertical;
  overflow: hidden;

  & > div[data-container] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }

  & img {
    max-width: 100%;
    max-height: 100%;
  }
`

export const Overlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: ${({drag}) => (drag ? 'blur(10px)' : '')};
  color: ${({tone}) => (tone ? studioTheme.color.light[tone].card.enabled.fg : '')};
  background-color: ${({tone, drag}) =>
    drag ? rgba(studioTheme.color.light[tone].card.enabled.bg, 0.8) : 'transparent'};
`

export const FlexOverlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`
