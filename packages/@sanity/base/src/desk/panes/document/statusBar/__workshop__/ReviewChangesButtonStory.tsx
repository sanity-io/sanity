import {Card, Flex} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React from 'react'

import {ReviewChangesButton} from '../sparkline/ReviewChangesButton'

const STATUS_OPTIONS: Record<string, 'changes' | 'saved' | 'syncing'> = {
  changes: 'changes',
  saved: 'saved',
  syncing: 'syncing',
}

export default function ReviewChangesButtonStory() {
  const collapsed = useBoolean('Collapsed', false)
  const status = useSelect('Status', STATUS_OPTIONS) || 'changes'

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <ReviewChangesButton status={status} lastUpdated="just now" collapsed={collapsed} />
      </Flex>
    </Card>
  )
}
