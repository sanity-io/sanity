import {Container, Box} from 'ui5'

import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useCommentsUpsell} from '../../hooks/useCommentsUpsell'

/** The upsell panel at the top of the comments inspector in upsell mode */
export function CommentsUpsellPanel() {
  const upsell = useCommentsUpsell()

  return (
    <Container size={1}>
      <Box marginBottom={6}>
        <UpsellPanel upsell={upsell} />
      </Box>
    </Container>
  )
}
