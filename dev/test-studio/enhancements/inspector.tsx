import React from 'react'
import {CloseIcon, EyeOpenIcon} from '@sanity/icons'
import {defineDocumentEnhancement} from 'sanity'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'

export const inspector = defineDocumentEnhancement({
  name: 'inspector',
  useMenuItem: ({isOpen, onClose, onOpen}) => ({
    icon: EyeOpenIcon,
    onClick: () => (isOpen ? onClose() : onOpen()),
    title: 'Inspector',
    tone: 'primary',
  }),
  view: {
    type: 'inspector',
    component: ({onClose}) => (
      <Box>
        <Stack space={2}>
          <Card padding={2} paddingLeft={3} borderBottom>
            <Flex align="center">
              <Box flex={1}>
                <Text size={1} weight="semibold">
                  Inspector
                </Text>
              </Box>

              <Button icon={CloseIcon} onClick={onClose} fontSize={1} mode="bleed" />
            </Flex>
          </Card>

          <Box padding={3}>
            <Text muted size={1}>
              This is a custom inspector
            </Text>
          </Box>
        </Stack>
      </Box>
    ),
  },
})
