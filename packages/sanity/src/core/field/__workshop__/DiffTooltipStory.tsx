import {Box} from '@sanity/ui'

import {DiffTooltip} from '../diff/components/DiffTooltip'

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
