import {Card, Flex} from '@sanity/ui'
import {styled} from 'styled-components'

export const CardOverlay = styled(Card)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

export const FlexContainer = styled(Flex)`
  height: 100%;
`

export const RatioBox = styled(Card)`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 3.75rem;
  max-height: 30dvh;
  aspect-ratio: var(--aspect-ratio);
`
