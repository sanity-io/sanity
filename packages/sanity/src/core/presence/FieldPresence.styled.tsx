import styled from 'styled-components'
import {Flex} from '@sanity/ui'
import {AVATAR_SIZE} from './constants'

export const FlexWrapper = styled(Flex)`
  & > div:first-child {
    flex: 1;
    min-width: 0;
  }
`

export const InnerBox = styled(Flex)`
  height: ${AVATAR_SIZE}px;
  min-width: 23px;
  vertical-align: top;
`
