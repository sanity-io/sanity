import {styled} from 'styled-components'
import {Flex} from 'ui5'

export const StyledPreviewFlex = styled(Flex)`
  /* this is a hack to avoid layout jumps while previews are loading
      or the message is not tall enough to fill the card
      there's probably better ways of solving this */
  min-height: 36px;
`
