import {Flex, Stack, Code} from '@sanity/ui'
import styled from 'styled-components'

export const FlexWrapper = styled(Flex)`
  text-overflow: ellipsis;
  overflow: hidden;
`

export const LeftSection = styled(Stack)`
  position: relative;
  width: 60%;
`

export const CodeWrapper = styled(Code)`
  position: relative;
  width: 100%;

  code {
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    max-width: 200px;
  }
`
