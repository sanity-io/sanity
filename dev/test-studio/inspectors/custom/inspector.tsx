import {Card} from '@sanity/ui'
import {type DocumentInspectorProps} from 'sanity'
import {DocumentInspectorHeader} from 'sanity/structure'
import {Text, Flex, Box} from 'ui5'

export function CustomInspector(props: DocumentInspectorProps) {
  const {onClose} = props

  return (
    <Flex flexDirection="column" height="100%" overflow="hidden">
      <DocumentInspectorHeader
        closeButtonLabel="Close custom inspector"
        flex="none"
        onClose={onClose}
        title="Custom inspector"
      />

      <Card flex={1} overflow="auto">
        <Box padding={4}>
          <Text size={1} as="div" trim={true}>
            (Inspector contents)
          </Text>
        </Box>
      </Card>
    </Flex>
  )
}
