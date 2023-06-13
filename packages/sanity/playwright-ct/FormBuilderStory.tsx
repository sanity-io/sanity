import {defineArrayMember, defineField, defineType} from '@sanity/types'
import React, {useMemo} from 'react'
import {
  createPatchChannel,
  FormBuilder,
  FormBuilderProps,
  useFormState,
  useWorkspace,
} from '../../../exports'
import {Wrapper} from '../../Wrapper'

const NOOP = () => null

const EMPTY_ARRAY: never[] = []

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
        name: 'body',
        of: [
          defineArrayMember({type: 'block'}),
          defineArrayMember({
            name: 'object',
            type: 'object',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
          }),
        ],
      }),
      defineField({
        type: 'string',
        name: 'genre',
        title: 'Genre',
        options: {
          list: [
            {title: 'Sci-Fi', value: 'sci-fi'},
            {title: 'Western', value: 'western'},
          ],
        },
      }),
    ],
  }),
]

export function FormBuilderStory() {
  return (
    <Wrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </Wrapper>
  )
}

function TestForm() {
  const patchChannel = useMemo(() => createPatchChannel(), [])

  const {schema} = useWorkspace()
  const schemaType = schema.get('test')

  if (!schemaType) {
    throw new Error('missing schema type')
  }

  if (schemaType.jsonType !== 'object') {
    throw new Error('schema type is not an object')
  }

  const formState = useFormState(schemaType, {
    focusPath: EMPTY_ARRAY,
    collapsedPaths: undefined,
    collapsedFieldSets: undefined,
    comparisonValue: null,
    fieldGroupState: undefined,
    openPath: EMPTY_ARRAY,
    presence: EMPTY_ARRAY,
    validation: EMPTY_ARRAY,
    value: {},
  })

  const formBuilderProps: FormBuilderProps = useMemo(
    () => ({
      // eslint-disable-next-line camelcase
      __internal_patchChannel: patchChannel,
      changed: false,
      changesOpen: false,
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
      focused: formState?.focused,
      focusPath: formState?.focusPath || EMPTY_ARRAY,
      groups: formState?.groups || EMPTY_ARRAY,
      id: formState?.id || '',
      level: formState?.level || 0,
      members: formState?.members || EMPTY_ARRAY,
      onChange: NOOP,
      onFieldGroupSelect: NOOP,
      onPathBlur: NOOP,
      onPathFocus: NOOP,
      onPathOpen: NOOP,
      onSelectFieldGroup: NOOP,
      onSetFieldSetCollapsed: NOOP,
      onSetPathCollapsed: NOOP,
      path: EMPTY_ARRAY,
      presence: EMPTY_ARRAY,
      schemaType: formState?.schemaType || schemaType,
      validation: EMPTY_ARRAY,
      value: formState?.value,
    }),
    [formState, patchChannel, schemaType]
  )

  return <FormBuilder {...formBuilderProps} />
}
