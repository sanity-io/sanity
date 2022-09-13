import styled from 'styled-components'
import {hues} from '@sanity/color'
import type {ThemeProps} from '@sanity/ui'

function gradientColor({theme}: ThemeProps) {
  return theme.sanity.color.dark ? '#323232' : hues.gray[50].hex
}

function backgroundColor({theme}: ThemeProps) {
  return theme.sanity.color.dark ? '#222222' : hues.gray[100].hex
}

export const Checkerboard = styled.div`
  background-color: ${backgroundColor};
  background-image: linear-gradient(45deg, ${gradientColor} 25%, transparent 25%),
    linear-gradient(-45deg, ${gradientColor} 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, ${gradientColor} 75%),
    linear-gradient(-45deg, transparent 75%, ${gradientColor} 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
`
