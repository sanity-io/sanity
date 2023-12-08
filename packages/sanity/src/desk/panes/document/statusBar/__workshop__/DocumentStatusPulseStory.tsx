import {Card, Flex} from '@sanity/ui'
import {useSelect} from '@sanity/ui-workshop'
import React from 'react'

import {DocumentStatusPulse} from '../sparkline/DocumentStatusPulse'

const STATUS_OPTIONS: Record<string, 'saved' | 'syncing'> = {
  saved: 'saved',
  syncing: 'syncing',
}

export default function DocumentStatusPulseStory() {
  const status = useSelect('Status', STATUS_OPTIONS) || 'saved'

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <DocumentStatusPulse status={status} />
      </Flex>
    </Card>
  )
}
