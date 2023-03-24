import {Box, Flex, Stack} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const StackWrapper = styled(Stack)`
  max-width: 200px;
`

export const ListWrapper = styled(Flex)`
  max-height: calc(100vh - 198px);
  min-width: 244px;
`

export const Root = styled(Box)(({$visible}: {$visible?: boolean}) => {
  return css`
    opacity: 0;
    pointer-events: none;

    ${$visible &&
    css`
      opacity: 1;
      pointer-events: auto;
    `}
  `
})
