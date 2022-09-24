import {Card} from '@sanity/ui'
import styled from 'styled-components'

export const PreviewCard = styled(Card)`
  /* this is a hack to avoid layout jumps while previews are loading
  there's probably better ways of solving this */
  min-height: 36px;

  /* TextWithTone uses its own logic to set color, and we therefore need
  to override this logic in order to set the correct color in different states */
  &[data-selected],
  &[data-pressed],
  &:active {
    [data-ui='TextWithTone'] {
      color: inherit;
    }
  }
`
