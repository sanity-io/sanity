import {Box} from '@sanity/ui'
import styled from 'styled-components'

export const CommandListItem = styled(Box)`
  white-space: normal;
  [data-active='true'] & {
    [data-focused='true'] &,
    [data-hovered='true'] & {
      @media (pointer: fine) {
        background: ${({theme}) => theme.sanity.color.button.bleed.default.hovered.bg};
      }
      // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
      box-shadow: none;
    }
  }
`
