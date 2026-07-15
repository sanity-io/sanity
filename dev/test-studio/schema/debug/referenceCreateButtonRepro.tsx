/**
 * Repro schema for custom "Create new" actions rendered next to reference
 * inputs, including inside array items (via custom `input`/`item` components).
 *
 * Regression scenario: add an item to the `sections` array of a
 * "Page (create button repro)" document, then click "Create new" (or click
 * right next to it, inside the item). The empty item must not be removed, and
 * the create flow must open the new document pane.
 */
import {Box, Button, Flex} from '@sanity/ui'
import {useCallback} from 'react'
import {
  defineField,
  defineType,
  type ObjectItemProps,
  type ReferenceInputProps,
  type ReferenceSchemaType,
  type ReferenceValue,
  set,
  setIfMissing,
} from 'sanity'
import {usePaneRouter} from 'sanity/structure'

type CustomReferenceInputProps = ReferenceInputProps | ObjectItemProps

function isItemProps(props: CustomReferenceInputProps): props is ObjectItemProps {
  return 'inputProps' in props
}

export function CustomReferenceInput(props: CustomReferenceInputProps) {
  const paneRouter = usePaneRouter()
  const schemaType = props.schemaType as ReferenceSchemaType
  const value = props.value as ReferenceValue | undefined

  const onChange = isItemProps(props) ? props.inputProps.onChange : props.onChange
  const onPathFocus = isItemProps(props) ? props.inputProps.onPathFocus : props.onPathFocus

  const handleCreate = useCallback(() => {
    const newId = `section-${Date.now()}` // deterministic ID builder stand-in

    onChange([
      setIfMissing({}),
      set(schemaType.name, ['_type']),
      set(newId, ['_ref']),
      set(true, ['_weak']),
      set({type: 'sectionDocRepro', weak: true, template: {id: 'sectionDocRepro'}}, [
        '_strengthenOnPublish',
      ]),
    ])

    paneRouter.handleEditReference?.({
      id: newId,
      type: 'sectionDocRepro',
      template: {id: 'sectionDocRepro', params: {}},
      parentRefPath: props.path,
    })

    onPathFocus([])
  }, [onChange, schemaType.name, paneRouter, props.path, onPathFocus])

  return (
    <Flex gap={2} align="flex-end">
      <Box flex={1}>{props.renderDefault(props)}</Box>
      {!value?._ref ? (
        <Button
          text="Create new"
          mode="ghost"
          disabled={Boolean(props.readOnly)}
          onClick={handleCreate}
        />
      ) : null}
    </Flex>
  )
}

export const sectionDocRepro = defineType({
  name: 'sectionDocRepro',
  type: 'document',
  title: 'Section (create button repro)',
  fields: [defineField({name: 'title', type: 'string'})],
})

export const pageDocRepro = defineType({
  name: 'pageDocRepro',
  type: 'document',
  title: 'Page (create button repro)',
  fields: [
    defineField({
      name: 'sections',
      type: 'array',
      of: [
        {
          name: 'sectionRef',
          type: 'reference',
          to: [{type: 'sectionDocRepro'}],
          components: {
            input: CustomReferenceInput,
            item: CustomReferenceInput,
          },
        },
      ],
    }),
  ],
})
