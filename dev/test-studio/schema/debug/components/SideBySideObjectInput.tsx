import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ItemProps, ObjectInputMembers, type ObjectInputProps} from 'sanity'

/**
 * Simple custom item component for array of objects
 * Displays the item's fields in a custom card layout
 * When editing, renders the custom input form (children)
 */
export function SideBySideObjectItem(props: ItemProps) {
  const {value, children} = props

  // Cast value to an object to access fields
  const item = value as Record<string, any>

  // Get field values
  const nameChild = item?.nameChild
  const internationalizedArrayStringChild = item?.internationalizedArrayStringChild

  return (
    <Card padding={3} radius={2} shadow={1} tone="primary">
      <Stack space={3}>
        {/* Preview of the item */}
        <Flex gap={3}>
          <Stack space={2} flex={1}>
            <Text size={0} weight="semibold">
              Name
            </Text>
            <Text size={1}>{nameChild || 'No name'}</Text>
          </Stack>
          <Stack space={2} flex={1}>
            <Text size={0} weight="semibold">
              Internationalized
            </Text>
            <Text size={1}>{internationalizedArrayStringChild?.[0]?.value || 'No value'}</Text>
          </Stack>
        </Flex>

        {/* Render the editing form (children) which will use the custom input component */}
        {children}
      </Stack>
    </Card>
  )
}

/**
 * Custom input component that displays fields side by side when editing
 */
export function SideBySideObjectInput(props: ObjectInputProps) {
  const {
    members,
    renderAnnotation,
    renderBlock,
    renderInlineBlock,
    renderInput,
    renderField,
    renderItem,
    renderPreview,
  } = props

  // Find the two field members we want to render side by side
  const nameChildMember = members.find((m) => m.kind === 'field' && m.name === 'nameChild')
  const internationalizedMember = members.find(
    (m) => m.kind === 'field' && m.name === 'internationalizedArrayStringChild',
  )

  // Filter out the two fields we want to render side by side
  const otherMembers = members.filter(
    (m) =>
      m.kind !== 'field' ||
      (m.name !== 'nameChild' && m.name !== 'internationalizedArrayStringChild'),
  )

  return (
    <Stack space={3}>
      {/* Render the two target fields side by side */}
      {nameChildMember && internationalizedMember && (
        <Flex gap={3}>
          <Box flex={1}>
            <ObjectInputMembers
              members={[nameChildMember]}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderInlineBlock={renderInlineBlock}
              renderInput={renderInput}
              renderField={renderField}
              renderItem={renderItem}
              renderPreview={renderPreview}
            />
          </Box>
          <Box flex={1}>
            <ObjectInputMembers
              members={[internationalizedMember]}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderInlineBlock={renderInlineBlock}
              renderInput={renderInput}
              renderField={renderField}
              renderItem={renderItem}
              renderPreview={renderPreview}
            />
          </Box>
        </Flex>
      )}

      {/* Render any other fields using default rendering */}
      {otherMembers.length > 0 && (
        <ObjectInputMembers
          members={otherMembers}
          renderAnnotation={renderAnnotation}
          renderBlock={renderBlock}
          renderInlineBlock={renderInlineBlock}
          renderInput={renderInput}
          renderField={renderField}
          renderItem={renderItem}
          renderPreview={renderPreview}
        />
      )}
    </Stack>
  )
}
