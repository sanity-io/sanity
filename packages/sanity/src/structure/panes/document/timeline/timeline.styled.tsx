import {Box, Flex, Stack} from '@sanity/ui'
import {css, styled} from 'styled-components'

export const StackWrapper = styled(Stack)`
  max-width: 200px;
`

export const ListWrapper = styled(Flex)<{$maxHeight: string}>`
  max-height: ${(props) => props.$maxHeight};
  min-width: 244px;
`

export const Root = styled(Box)<{$visible?: boolean}>(({$visible}) => {
  return css`
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;

    ${$visible &&
    css`
      opacity: 1;
      pointer-events: auto;
    `}
  `
})
