import {studioTheme, rgba, Card, Flex} from '@sanity/ui'
import styled from 'styled-components'

export const RatioBox = styled(Card)`
  position: relative;
  max-height: ${({maxHeight}) => maxHeight};
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
  color: ${studioTheme.color.light.primary.card.enabled.fg};
  background-color: ${({theme, drag}) =>
    drag ? rgba(studioTheme.color.light.primary.card.enabled.bg, 0.8) : 'transparent'};
`

export const MAX_HEIGHT = '15rem'
