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
  useMenuItem: ({isOpen, onClose, onOpen}) => ({
    icon: BookIcon,
    onClick: () => (isOpen ? onClose() : onOpen()),
    title: 'Popover',
    tone: 'primary',
  }),
})
