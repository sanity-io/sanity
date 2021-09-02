import {Card, Layer} from '@sanity/ui'
import styled from 'styled-components'

export const Root = styled(Layer)`
  position: sticky;
  bottom: 0;

  &:before {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    right: 0;
    top: -1px;
    border-bottom: 1px solid var(--card-shadow-outline-color);
  }
`

export const RootCard = styled(Card)`
  padding-bottom: env(safe-area-inset-bottom);
`
