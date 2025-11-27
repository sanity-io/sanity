import {Box} from '@sanity/ui'

import {NoChanges} from '../diff'

export default function NoChangesStory() : React.JSX.Element {
  return (
    <Box padding={4}>
      <NoChanges />
    </Box>
  )
}
