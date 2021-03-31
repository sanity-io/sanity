import styled from 'styled-components'
import {hues} from '@sanity/color'

export const Checkerboard = styled.div`
  background-color: ${hues.gray[100].hex};
  background-image: linear-gradient(45deg, ${hues.gray[50].hex} 25%, transparent 25%),
    linear-gradient(-45deg, ${hues.gray[50].hex} 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, ${hues.gray[50].hex} 75%),
    linear-gradient(-45deg, transparent 75%, ${hues.gray[50].hex} 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
`
