import React from 'react'
import {BookIcon} from '@sanity/icons'
import {defineDocumentEnhancement} from 'sanity'
import {Box, Text} from '@sanity/ui'

export const dialogEnhancement = defineDocumentEnhancement({
  name: 'dialog',
  view: {
    type: 'dialog',
    component: () => (
      <Box padding={3}>
        <Text>Dialog!</Text>
      </Box>
    ),
  },
  menuItem: {
    title: 'Dialog',
    icon: BookIcon,
    tone: 'primary',
  },
})
