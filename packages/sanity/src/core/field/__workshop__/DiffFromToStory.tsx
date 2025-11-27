import {Box} from '@sanity/ui'

import {DiffFromTo} from '../diff'

/**
 * TODO
 */
export default function DiffFromToStory() : React.JSX.Element {
  return (
    <Box padding={4}>
      <DiffFromTo {...({} as any)} />
    </Box>
  )
}
