import {Box} from '@sanity/ui'

import {DiffString} from '../diff/components/DiffString'

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
