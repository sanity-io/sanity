import {css, styled} from 'styled-components'
import {Flex, Box} from 'ui5'

export const ListWrapper = styled(Flex)<{$maxHeight: string}>`
  max-height: ${(props) => props.$maxHeight};
  min-width: 244px;
`

export const Root = styled(Box)<{$visible?: boolean}>(({$visible}) => {
  return css`
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;

    ${
      $visible &&
      css`
        opacity: 1;
        pointer-events: auto;
      `
    }
  `
})
