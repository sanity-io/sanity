import {FallbackDiff} from '../diff/components/FallbackDiff'
import {Box} from '@sanity/ui'

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
