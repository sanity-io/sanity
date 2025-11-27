import {Box} from '@sanity/ui'

import {RevertChangesButton} from '../diff/components/RevertChangesButton'

export default function RevertChangesButtonStory() : React.JSX.Element {
  return (
    <Box padding={4}>
      <RevertChangesButton changeCount={1} />
    </Box>
  )
}
