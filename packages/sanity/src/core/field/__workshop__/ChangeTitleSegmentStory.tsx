import {Box} from '@sanity/ui'

import {ChangeTitleSegment} from '../diff/components/ChangeTitleSegment'

export default function ChangeTitleSegmentStory() : React.JSX.Element {
  return (
    <Box padding={4}>
      <ChangeTitleSegment segment="Test" />
    </Box>
  )
}
