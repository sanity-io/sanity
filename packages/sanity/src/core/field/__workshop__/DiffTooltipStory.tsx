import {DiffTooltip} from '../diff'
import {Box} from '@sanity/ui'

/**
 * TODO
 */
export default function DiffTooltipStory() {
  return (
    <Box padding={4}>
      <DiffTooltip {...({} as any)} />
    </Box>
  )
}
