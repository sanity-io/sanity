import {
  type BooleanSchemaType,
  defineField,
  defineType,
  type FormNodeValidation,
  type ObjectSchemaType,
} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useRef} from 'react'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../hooks/useSchema'
import {type BooleanInputProps} from '../../types/inputProps'
import {BooleanInput} from '../BooleanInput'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'boolean', name: 'switchField', title: 'Published'}),
      defineField({
        type: 'boolean',
        name: 'checkboxField',
        title: 'Featured',
        options: {layout: 'checkbox'},
      }),
      defineField({
        type: 'boolean',
        name: 'describedField',
        title: 'Indexed',
        description: 'Include this document in search results',
      }),
    ],
  }),
]

const EMPTY_ARRAY: never[] = []
const REQUIRED_ERROR: FormNodeValidation[] = [
  {level: 'error', message: 'This field is required', path: ['requiredSwitch']},
]

function computeDiff(): never {
  throw new Error('not used by this story')
}

function booleanType(documentType: ObjectSchemaType, name: string): BooleanSchemaType {
  const field = documentType.fields.find((entry) => entry.name === name)
  if (!field) {
    throw new Error(`Missing boolean field ${name}`)
  }
  return field.type as BooleanSchemaType
}

function BooleanRow(props: {
  label: string
  schemaType: BooleanSchemaType
  value?: boolean
  readOnly?: boolean
  validation?: FormNodeValidation[]
}) {
  const {label, schemaType, value, readOnly = false, validation = EMPTY_ARRAY} = props
  const inputRef = useRef<HTMLInputElement>(null)
  const inputProps: BooleanInputProps = {
    __unstable_computeDiff: computeDiff,
    changed: false,
    changedFromBaseVariant: false,
    displayInlineChanges: false,
    elementProps: {
      'aria-describedby': undefined,
      'id': schemaType.name,
      'onBlur': noop,
      'onChange': noop,
      'onFocus': noop,
      'readOnly': readOnly,
      'ref': inputRef,
      'style': {},
    },
    hasBaseVariant: false,
    hasUpstreamVersion: false,
    id: schemaType.name,
    level: 0,
    onChange: noop,
    path: [schemaType.name],
    presence: EMPTY_ARRAY,
    readOnly,
    renderDefault: () => <></>,
    schemaType,
    validation,
    value,
  }

  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {label}
      </Text>
      <BooleanInput {...inputProps} />
    </VStack>
  )
}

function BooleanInputs() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const switchType = booleanType(documentType, 'switchField')
  const checkboxType = booleanType(documentType, 'checkboxField')
  const describedType = booleanType(documentType, 'describedField')

  return (
    <Card padding={4} style={{maxWidth: 420}}>
      <VStack gap={5}>
        <BooleanRow label="switch on" schemaType={switchType} value={true} />
        <BooleanRow label="switch off" schemaType={switchType} value={false} />
        <BooleanRow label="switch indeterminate" schemaType={switchType} />
        <BooleanRow label="switch read-only" readOnly schemaType={switchType} value={true} />
        <BooleanRow label="switch with error" schemaType={switchType} validation={REQUIRED_ERROR} />
        <BooleanRow label="switch with description" schemaType={describedType} value={true} />
        <BooleanRow label="checkbox on" schemaType={checkboxType} value={true} />
        <BooleanRow label="checkbox off" schemaType={checkboxType} value={false} />
        <BooleanRow label="checkbox read-only" readOnly schemaType={checkboxType} value={false} />
      </VStack>
    </Card>
  )
}

/**
 * Chromatic sentinel for the boolean form input after the ui5 Flex/Box
 * migration. Pins switch and checkbox layouts, on/off/indeterminate, the
 * read-only transparent card, the critical validation tone, and a
 * description. Tooltips stay closed.
 */
export function BooleanInputStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <BooleanInputs />
    </TestWrapper>
  )
}
