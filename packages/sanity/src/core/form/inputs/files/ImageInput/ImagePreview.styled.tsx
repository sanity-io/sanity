import {Card, type CardTone, Flex, rgba, studioTheme} from '@sanity/ui'
import {css, styled} from 'styled-components'

export const RatioBox = styled(Card)`
  position: relative;
  width: 100%;
  min-height: 3.75rem;
  max-height: min(calc(var(--image-height) * 1px), 20rem);
  aspect-ratio: var(--image-width) / var(--image-height);

  & img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: scale-down;
    object-position: center;
  }
`

export const Overlay = styled(Flex)<{
  $drag: boolean
  $tone: Exclude<CardTone, 'inherit'>
}>(({$drag, $tone}) => {
  const textColor = studioTheme.color.light[$tone].card.enabled.fg
  const backgroundColor = rgba(studioTheme.color.light[$tone].card.enabled.bg, 0.8)

  return css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: ${$drag ? 'blur(10px)' : ''};
    color: ${$tone ? textColor : ''};
    background-color: ${$drag ? backgroundColor : 'transparent'};
  `
})

export const FlexOverlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`
