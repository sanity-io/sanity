import {Box} from '@sanity/ui-v3'

import {DiffString} from '../diff'

/**
 * TODO
 */
export default function DiffStringStory() {
  return (
    <Box padding={4}>
      <DiffString {...({} as any)} />
    </Box>
  )
}
