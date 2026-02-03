import {Box} from '@sanity/ui'

import {DiffTooltip} from '../diff'

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
