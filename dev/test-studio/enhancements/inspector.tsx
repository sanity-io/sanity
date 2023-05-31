import React from 'react'
import {EyeOpenIcon} from '@sanity/icons'
import {defineDocumentEnhancement} from 'sanity'
import {Box, Stack, Text} from '@sanity/ui'

export const inspector = defineDocumentEnhancement({
  name: 'inspector',
  view: {
    type: 'inspector',
    component: () => (
      <Box padding={4} paddingY={5}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Inspector
          </Text>

          <Text muted size={1}>
            This is a custom inspector
          </Text>
        </Stack>
      </Box>
    ),
  },
  menuItem: {
    title: 'Inspector',
    icon: EyeOpenIcon,
    tone: 'primary',
  },
})
