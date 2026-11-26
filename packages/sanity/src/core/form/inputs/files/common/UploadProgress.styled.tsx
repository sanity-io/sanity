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
