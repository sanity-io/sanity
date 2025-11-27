import {Box} from '@sanity/ui'

import {DiffInspectWrapper} from '../diff/components/DiffInspectWrapper'

/**
 * TODO
 */
export default function DiffInspectWrapperStory() : React.JSX.Element {
  return (
    <Box padding={4}>
      <DiffInspectWrapper {...({} as any)} />
    </Box>
  )
}
