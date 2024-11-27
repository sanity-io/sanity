import {Box, Container} from '@sanity/ui'

import {type UpsellData} from '../../../studio/upsell/types'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'

interface CommentsUpsellPanelProps {
  data: UpsellData
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

/**
 * @internal
 * @hidden
 */
export function CommentsUpsellPanel(props: CommentsUpsellPanelProps) {
  const {data, onPrimaryClick, onSecondaryClick} = props
  return (
    <Container width={1}>
      <Box marginBottom={6}>
        <UpsellPanel
          data={data}
          onPrimaryClick={onPrimaryClick}
          onSecondaryClick={onSecondaryClick}
        />
      </Box>
    </Container>
  )
}
