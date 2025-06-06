import {Box} from '@sanity/ui-v3'

import {GroupChange} from '../diff/components/GroupChange'

/**
 * TODO
 */
export default function GroupChangeStory() {
  return (
    <Box padding={4}>
      <GroupChange {...({} as any)} />
    </Box>
  )
}
