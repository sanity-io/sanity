import {Box} from '@sanity/ui'

import {FieldChange} from '../diff/components/FieldChange'

/**
 * TODO
 */
export default function FieldChangeStory() : React.JSX.Element {
  return (
    <Box padding={4}>
      <FieldChange {...({} as any)} />
    </Box>
  )
}
