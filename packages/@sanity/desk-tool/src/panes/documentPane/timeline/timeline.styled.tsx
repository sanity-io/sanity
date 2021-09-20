import {Box, Menu} from '@sanity/ui'
import styled from 'styled-components'

export const Root = styled(Box)`
  overflow: auto;
  -webkit-overflow-scrolling: touch;
`

export const MenuWrapper = styled(Menu)`
  overflow: auto;
  box-sizing: border-box;
  max-height: calc(100vh - 198px);
`
