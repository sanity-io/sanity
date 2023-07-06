import {Box, Card, Flex, Text} from '@sanity/ui'
import React from 'react'
import {DocumentInspectorProps} from 'sanity'
import {DocumentInspectorHeader} from 'sanity/desk'

export function CustomInspector(props: DocumentInspectorProps) {
  const {onClose} = props

  return (
    <Flex direction="column" height="fill" overflow="hidden">
      <DocumentInspectorHeader
        closeButtonLabel="Close custom inspector"
        flex="none"
        onClose={onClose}
        title="Custom inspector"
      />

      <Card flex={1} overflow="auto">
        <Box padding={4}>
          <Text size={1}>(Inspector contents)</Text>
        </Box>
      </Card>
    </Flex>
  )
}
