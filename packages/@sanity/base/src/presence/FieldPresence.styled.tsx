import styled from 'styled-components'
import {Flex} from '@sanity/ui'

export const FlexWrapper = styled(Flex)`
  & > div:first-child {
    flex: 1;
    min-width: 0;
  }
`

export const InnerBox = styled(Flex)`
  height: 23px;
  min-width: 23px;
  vertical-align: top;
`
