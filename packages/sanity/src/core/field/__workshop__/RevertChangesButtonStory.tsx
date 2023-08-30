import {Box} from '@sanity/ui'
import React from 'react'
import {RevertChangesButton} from '../diff/components/RevertChangesButton'

export default function RevertChangesButtonStory() {
  return (
    <Box padding={4}>
      <RevertChangesButton changeCount={1} />
    </Box>
  )
}
