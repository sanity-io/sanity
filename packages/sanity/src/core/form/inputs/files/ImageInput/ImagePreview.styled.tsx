import {Card, Flex} from '@sanity/ui'
import {styled} from 'styled-components'

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

export const Overlay = styled(Card)`
  display: flex;
  justify-content: flex-end;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(10px);
  background-color: color-mix(in srgb, transparent, var(--card-bg-color) 80%);
`

export const FlexOverlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`
