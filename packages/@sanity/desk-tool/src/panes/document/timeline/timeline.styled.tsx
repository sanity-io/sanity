import {Box, Menu, Stack, VirtualList} from '@sanity/ui'
import styled from 'styled-components'

export const Root = styled(Box)`
  -webkit-overflow-scrolling: touch;
  min-width: 244px;
`
export const StackWrapper = styled(Stack)`
  max-width: 200px;
`

export const MenuWrapper = styled(Menu)`
  overflow: auto;
  box-sizing: border-box;
  max-height: calc(100vh - 198px);
`

export const TimelineVirtualList = styled(VirtualList)`
  width: 100%;

  // Remove the first and last items lines around the icons
  & > div > div:first-child > [data-ui='MenuItem'] {
    & [data-ui='IconTimelineFlex'] {
      &:after {
        display: none;
      }
    }
  }
  & > div > div:last-child > [data-ui='MenuItem'] {
    & [data-ui='IconTimelineFlex'] {
      &:before {
        display: none;
      }
    }
  }
`
