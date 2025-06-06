import {Card, Layer} from '@sanity/ui-v3'
import {styled} from 'styled-components'

export const Root = styled(Layer)`
  position: sticky;
  bottom: 0;
`

export const RootCard = styled(Card)`
  padding-bottom: env(safe-area-inset-bottom);
`
