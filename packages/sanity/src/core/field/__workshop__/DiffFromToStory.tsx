import {Box} from '@sanity/ui'

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
