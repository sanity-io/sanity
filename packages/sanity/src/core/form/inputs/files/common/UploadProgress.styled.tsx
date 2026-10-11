import {Code} from '@sanity/ui/code'
import {styled} from 'styled-components'
import {Flex, VStack} from 'ui5'

import {RatioBox} from '../ImageInput/ImagePreview.styled'

export const CardWrapper = styled(RatioBox)`
  box-sizing: border-box;
`

export const FlexWrapper = styled(Flex)`
  box-sizing: border-box;
  text-overflow: ellipsis;
  overflow: hidden;
  overflow: clip;
`

export const LeftSection = styled(VStack)`
  position: relative;
  width: 60%;
`

export const CodeWrapper = styled(Code)`
  position: relative;
  width: 100%;

  code {
    overflow: hidden;
    overflow: clip;
    text-overflow: ellipsis;
    position: relative;
    max-width: 200px;
  }
`
