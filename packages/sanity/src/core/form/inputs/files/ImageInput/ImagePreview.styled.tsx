import {Card, type CardTone, Flex, rgba, studioTheme} from '@sanity/ui'
import {useColorSchemeValue} from 'sanity'
import {css, styled} from 'styled-components'

export const RatioBox = styled(Card)`
  position: relative;
  width: 100%;
  min-height: 3.75rem;
  max-height: min(calc(var(--image-height) * 1px), 30vh);
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
  $tone: Exclude<CardTone, 'inherit'>
}>(({$tone}) => {
  const colorScheme = useColorSchemeValue()
  const textColor = studioTheme.color[colorScheme][$tone].card.enabled.fg
  const backgroundColor = rgba(studioTheme.color[colorScheme][$tone].card.enabled.bg, 0.8)

  return css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: blur(10px);
    color: ${$tone ? textColor : ''};
    background-color: ${backgroundColor};
  `
})

export const FlexOverlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`
