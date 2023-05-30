import React from 'react'
import {BookIcon} from '@sanity/icons'
import {defineDocumentEnhancement} from 'sanity'
import {Box, Text} from '@sanity/ui'

export const popoverEnhancement = defineDocumentEnhancement({
  name: 'popover',
  view: {
    type: 'popover',
    component: () => (
      <Box padding={3}>
        <Text>Popover!</Text>
      </Box>
    ),
  },
  menuItem: {
    title: 'Popover',
    icon: BookIcon,
    tone: 'primary',
  },
})
