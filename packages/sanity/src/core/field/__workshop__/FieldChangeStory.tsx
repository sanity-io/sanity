import {FieldChange} from '../diff/components/FieldChange'
import {Box} from '@sanity/ui'

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
