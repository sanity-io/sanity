import {Box} from '@sanity/ui-v3'

import {DiffFromTo} from '../diff'

/**
 * TODO
 */
export default function DiffFromToStory() {
  return (
    <Box padding={4}>
      <DiffFromTo {...({} as any)} />
    </Box>
  )
}
