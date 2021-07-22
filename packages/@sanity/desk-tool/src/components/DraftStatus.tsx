import {EditIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import React from 'react'

const DraftStatus = () => (
  <Text as="span" muted size={1}>
    <EditIcon aria-label="There are unpublished edits" title="There are unpublished edits" />
  </Text>
)

export default DraftStatus
