import {Flex} from '@sanity/ui'
import {styled} from 'styled-components'

export const FixedHeightFlex = styled(Flex).attrs({padding: 2, align: 'center', sizing: 'border'})`
  height: 40px;
  min-height: 40px;
`
