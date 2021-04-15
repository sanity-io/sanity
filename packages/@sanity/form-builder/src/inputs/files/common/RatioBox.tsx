import {Box} from '@sanity/ui'
import styled from 'styled-components'

export const RatioBox = styled(Box)<{ratio?: number}>`
  position: relative;
  padding-bottom: calc(${({ratio = 3 / 2}) => 1 / ratio} * 100%);

  & > div {
    position: absolute;
    top: ${({padding = 0}) => padding}px;
    left: ${({padding = 0}) => padding}px;
    right: ${({padding = 0}) => padding}px;
    bottom: ${({padding = 0}) => padding}px;
  }
`
