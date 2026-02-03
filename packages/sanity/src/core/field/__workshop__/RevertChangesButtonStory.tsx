import {RevertChangesButton} from '../diff/components/RevertChangesButton'
import {Box} from '@sanity/ui'

export default function RevertChangesButtonStory() {
  return (
    <Box padding={4}>
      <RevertChangesButton changeCount={1} />
    </Box>
  )
}
