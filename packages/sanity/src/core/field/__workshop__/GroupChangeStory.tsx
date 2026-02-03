import {GroupChange} from '../diff/components/GroupChange'
import {Box} from '@sanity/ui'

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
