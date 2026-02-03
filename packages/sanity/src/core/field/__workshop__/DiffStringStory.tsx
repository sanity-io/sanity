import {DiffString} from '../diff'
import {Box} from '@sanity/ui'

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
