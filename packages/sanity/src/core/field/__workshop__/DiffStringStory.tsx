import {Box} from '@sanity/ui'

import {DiffString} from '../diff'

/**
 * TODO
 */
export default function DiffStringStory() : React.JSX.Element {
  return (
    <Box padding={4}>
      <DiffString {...({} as any)} />
    </Box>
  )
}
