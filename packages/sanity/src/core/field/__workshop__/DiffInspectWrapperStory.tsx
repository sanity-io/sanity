import {DiffInspectWrapper} from '../diff/components/DiffInspectWrapper'
import {Box} from '@sanity/ui'

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
