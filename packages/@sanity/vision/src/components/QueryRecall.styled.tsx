import {Box, Stack} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

export const FixedHeader = styled(Stack)`
  position: sticky;
  top: 0;
  background: ${vars.color.bg};
  z-index: 1;
`

export const ScrollContainer = styled(Box)`
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${vars.color.border};
    border-radius: 4px;
  }
`
