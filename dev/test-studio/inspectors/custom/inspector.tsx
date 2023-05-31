import {CloseIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import React from 'react'
import {DocumentInspectorProps} from 'sanity'
import {DocumentInspectorHeaderCard} from 'sanity/desk'

export default function CustomInspector(props: DocumentInspectorProps) {
  const {onClose} = props

  return (
    <Flex direction="column" height="fill" overflow="hidden">
      <DocumentInspectorHeaderCard as="header" flex="none">
        <Flex as="header">
          <Box flex={1} padding={4}>
            <Text as="h1" size={1} weight="semibold">
              Custom inspector
            </Text>
          </Box>
          <Box padding={3}>
            <Button
              aria-label="Close custom inspector"
              fontSize={1}
              icon={CloseIcon}
              mode="bleed"
              onClick={onClose}
              padding={2}
            />
          </Box>
        </Flex>
      </DocumentInspectorHeaderCard>

      <Card flex={1} overflow="auto">
        <Box padding={4}>
          <Text size={1}>(Inspector contents)</Text>
        </Box>
      </Card>
    </Flex>
  )
}
