import {Box} from '@sanity/ui'

import {DiffFromTo} from '../diff/components/DiffFromTo'

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
