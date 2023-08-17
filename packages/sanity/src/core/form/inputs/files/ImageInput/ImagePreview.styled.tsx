import {studioTheme, rgba, Card, Flex, CardTone, Spinner} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const MAX_DEFAULT_HEIGHT = 30

export const RatioBox = styled(Card)`
  position: relative;
  width: 100%;
  overflow: hidden;
  overflow: clip;
  min-height: 3.75rem;
  max-height: 20rem;

  & > div[data-container] {
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

export const SpinnerWrapper = styled(Spinner)`
  position: absolute;
`

export const Overlay = styled(Flex)(({
  tone,
  drag,
}: {
  tone: Exclude<CardTone, 'inherit'>
  drag: boolean
}) => {
  const textColor = studioTheme.color.light[tone].card.enabled.fg
  const backgroundColor = rgba(studioTheme.color.light[tone].card.enabled.bg, 0.8)

  return css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: ${drag ? 'blur(10px)' : ''};
    color: ${tone ? textColor : ''};
    background-color: ${drag ? backgroundColor : 'transparent'};
  `
})

export const FlexOverlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`
