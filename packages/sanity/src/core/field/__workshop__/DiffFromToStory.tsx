import {DiffFromTo} from '../diff'
import {Box} from '@sanity/ui'

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
