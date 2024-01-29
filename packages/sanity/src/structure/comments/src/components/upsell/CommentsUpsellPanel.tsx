import {Box, Card} from '@sanity/ui'
import {CommentsUpsellData} from '../../types'
import {CommentsUpsellContent} from './CommentsUpsellContent'

interface CommentsUpsellPanelProps {
  data: CommentsUpsellData
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

export function CommentsUpsellPanel(props: CommentsUpsellPanelProps) {
  const {data, onPrimaryClick, onSecondaryClick} = props

  return (
    <Box paddingX={3}>
      <Card radius={3} marginRight={3} overflow={'hidden'} border>
        <CommentsUpsellContent
          data={data}
          onPrimaryClick={onPrimaryClick}
          onSecondaryClick={onSecondaryClick}
        />
      </Card>
    </Box>
  )
}
