import {Box, Stack} from '@sanity/ui'
import {styled, type StyledComponent} from 'styled-components'

export const FixedHeader: StyledComponent<typeof Stack, any> = styled(Stack)`
  position: sticky;
  top: 0;
  background: ${({theme}) => theme.sanity.color.base.bg};
  z-index: 1;
`

export const ScrollContainer: StyledComponent<typeof Box, any> = styled(Box)`
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
    background: ${({theme}) => theme.sanity.color.base.border};
    border-radius: 4px;
  }
`
