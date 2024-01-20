import {Box} from '@sanity/ui'

import {FallbackDiff} from '../diff/components/FallbackDiff'

/**
 * TODO
 */
export default function FallbackDiffStory() {
  return (
    <Box padding={4}>
      <FallbackDiff {...({} as any)} />
    </Box>
  )
}
