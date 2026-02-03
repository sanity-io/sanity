import {type UpsellData} from '../../../studio/upsell/types'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {Box, Container} from '@sanity/ui'

interface CommentsUpsellPanelProps {
  data: UpsellData
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

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
