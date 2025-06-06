import {Box} from '@sanity/ui-v3'

import {DiffInspectWrapper} from '../diff/components/DiffInspectWrapper'

/**
 * TODO
 */
export default function DiffInspectWrapperStory() {
  return (
    <Box padding={4}>
      <DiffInspectWrapper {...({} as any)} />
    </Box>
  )
}
