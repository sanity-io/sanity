import {Box} from '@sanity/ui-v3'

import {RevertChangesButton} from '../diff/components/RevertChangesButton'

export default function RevertChangesButtonStory() {
  return (
    <Box padding={4}>
      <RevertChangesButton changeCount={1} />
    </Box>
  )
}
