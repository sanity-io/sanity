import {Box} from '@sanity/ui-v3'

import {FieldChange} from '../diff/components/FieldChange'

/**
 * TODO
 */
export default function FieldChangeStory() {
  return (
    <Box padding={4}>
      <FieldChange {...({} as any)} />
    </Box>
  )
}
