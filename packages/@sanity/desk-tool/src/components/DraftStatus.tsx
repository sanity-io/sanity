import {EditIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import React from 'react'

export const DraftStatus = () => (
  <Text as="span" muted title="There are unpublished edits">
    <EditIcon aria-label="There are unpublished edits" />
  </Text>
)
