import {Box} from '@sanity/ui'
import styled from 'styled-components'

export const RatioBox = styled(Box)<{ratio?: number; maxHeight?: string}>`
  position: relative;
  padding-bottom: min(
    calc(${({ratio = 3 / 2}) => 1 / ratio} * 100%),
    ${({maxHeight = '40vh'}) => maxHeight}
  );

  & > div {
    position: absolute;
    top: ${({padding = 0}) => padding}px;
    left: ${({padding = 0}) => padding}px;
    right: ${({padding = 0}) => padding}px;
    bottom: ${({padding = 0}) => padding}px;
  }
`
