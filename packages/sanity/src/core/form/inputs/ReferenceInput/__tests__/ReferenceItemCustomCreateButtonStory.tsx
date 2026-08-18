import {defineArrayMember, defineField, defineType, type ReferenceValue} from '@sanity/types'
import {Box, Flex} from '@sanity/ui'
import {useCallback} from 'react'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {set, setIfMissing} from '../../../patch/patch'
import {type ObjectItem, type ObjectItemProps} from '../../../types/itemProps'

export const CREATED_SECTION_ID = 'deterministic-section-id'

/**
 * Mirrors a common studio customization: a custom item component for reference
 * items in arrays which renders a "Create new" action (assigning a
 * deterministic document ID) next to the default reference input.
 */
function CustomReferenceItem(props: ObjectItemProps<ReferenceValue & ObjectItem>) {
  const {inputProps, schemaType, value} = props
  const {onChange} = inputProps

  const handleCreate = useCallback(() => {
    onChange([
      setIfMissing({}),
      set(schemaType.name, ['_type']),
      set(CREATED_SECTION_ID, ['_ref']),
      set(true, ['_weak']),
    ])
  }, [onChange, schemaType.name])

  return (
    <Flex align="center" data-testid="custom-reference-item" gap={3} paddingRight={3}>
      <Box flex={1}>{props.renderDefault(props)}</Box>
      {value?._ref ? null : (
        <Button
          data-testid="custom-create-new-button"
          mode="ghost"
          onClick={handleCreate}
          text="Create new"
        />
      )}
    </Flex>
  )
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'string',
        name: 'title',
        title: 'Title',
      }),
      defineField({
        type: 'array',
        name: 'sections',
        title: 'Sections',
        of: [
          defineArrayMember({
            type: 'reference',
            name: 'sectionRef',
            to: [{type: 'sectionDoc'}],
            components: {item: CustomReferenceItem},
          }),
        ],
      }),
    ],
  }),
  defineType({
    type: 'document',
    name: 'sectionDoc',
    title: 'Section',
    fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
  }),
]

export function ReferenceItemCustomCreateButtonStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}
