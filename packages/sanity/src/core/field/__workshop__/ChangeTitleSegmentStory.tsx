import {ChangeTitleSegment} from '../diff/components/ChangeTitleSegment'
import {Box} from '@sanity/ui'

export default function ChangeTitleSegmentStory() {
  return (
    <Box padding={4}>
      <ChangeTitleSegment segment="Test" />
    </Box>
  )
}
