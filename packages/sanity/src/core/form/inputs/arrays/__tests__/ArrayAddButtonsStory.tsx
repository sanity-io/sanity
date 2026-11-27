import {
  type ArraySchemaType,
  defineArrayMember,
  defineField,
  defineType,
  isArraySchemaType,
  isObjectSchemaType,
  type ObjectSchemaType,
  type Path,
} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../hooks/useSchema'
import {type ObjectItem} from '../../../types/itemProps'
import {ArrayOfObjectsFunctions} from '../ArrayOfObjectsInput/ArrayOfObjectsFunctions'
import {ArrayOfPrimitivesFunctions} from '../ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions'
import {ArrayValidationProvider} from '../common/ArrayValidationContext'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        name: 'authors',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'author',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
        ],
      }),
      defineField({
        name: 'blocks',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'quote',
            title: 'Quote',
            fields: [defineField({name: 'text', type: 'string'})],
          }),
          defineArrayMember({
            type: 'object',
            name: 'callout',
            title: 'Callout',
            fields: [defineField({name: 'text', type: 'string'})],
          }),
        ],
      }),
      defineField({
        name: 'cappedAuthors',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'cappedAuthor',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
        ],
        validation: (Rule) => Rule.max(1),
      }),
      defineField({
        name: 'tags',
        type: 'array',
        of: [{type: 'string'}],
      }),
      defineField({
        name: 'mixedPrimitives',
        type: 'array',
        of: [{type: 'string'}, {type: 'number'}],
      }),
      defineField({
        name: 'cappedTags',
        type: 'array',
        of: [{type: 'string'}],
        validation: (Rule) => Rule.max(1),
      }),
    ],
  }),
]

const PATH: Path = []

function createObjectItem(): ObjectItem {
  return {_key: 'item-1', _type: 'author'}
}

function arrayField(documentType: ObjectSchemaType, name: string): ArraySchemaType {
  const field = documentType.fields.find((member) => member.name === name)
  if (!field || !isArraySchemaType(field.type)) {
    throw new Error(`Expected array field "${name}"`)
  }
  return field.type
}

function objectFunctionsProps(schemaType: ArraySchemaType) {
  return {
    onChange: noop,
    onItemAppend: noop,
    onItemPrepend: noop,
    onValueCreate: createObjectItem,
    path: PATH,
    schemaType,
    value: [] as ObjectItem[],
  }
}

function primitiveFunctionsProps(schemaType: ArraySchemaType) {
  return {
    onChange: noop,
    onItemAppend: noop,
    onItemPrepend: noop,
    onValueCreate: () => '',
    path: PATH,
    schemaType,
    value: [] as string[],
  }
}

function ArrayAddButtons() {
  const schema = useSchema()
  const documentType = schema.get('test')
  if (!documentType || !isObjectSchemaType(documentType)) {
    throw new Error('Expected object document type "test"')
  }

  const authors = arrayField(documentType, 'authors')
  const blocks = arrayField(documentType, 'blocks')
  const cappedAuthors = arrayField(documentType, 'cappedAuthors')
  const tags = arrayField(documentType, 'tags')
  const mixedPrimitives = arrayField(documentType, 'mixedPrimitives')
  const cappedTags = arrayField(documentType, 'cappedTags')

  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            objects: add one type
          </Text>
          <ArrayOfObjectsFunctions {...objectFunctionsProps(authors)} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            objects: add multiple types
          </Text>
          <ArrayOfObjectsFunctions {...objectFunctionsProps(blocks)} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            objects: read-only
          </Text>
          <ArrayOfObjectsFunctions {...objectFunctionsProps(authors)} readOnly />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            objects: max reached
          </Text>
          <ArrayValidationProvider schemaType={cappedAuthors} itemCount={1}>
            <ArrayOfObjectsFunctions {...objectFunctionsProps(cappedAuthors)} />
          </ArrayValidationProvider>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            primitives: add one type
          </Text>
          <ArrayOfPrimitivesFunctions {...primitiveFunctionsProps(tags)} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            primitives: add multiple types
          </Text>
          <ArrayOfPrimitivesFunctions {...primitiveFunctionsProps(mixedPrimitives)} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            primitives: read-only
          </Text>
          <ArrayOfPrimitivesFunctions {...primitiveFunctionsProps(tags)} readOnly />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            primitives: max reached
          </Text>
          <ArrayValidationProvider schemaType={cappedTags} itemCount={1}>
            <ArrayOfPrimitivesFunctions {...primitiveFunctionsProps(cappedTags)} />
          </ArrayValidationProvider>
        </VStack>
      </VStack>
    </Card>
  )
}

/**
 * Chromatic sentinel for the array "Add item" / "Add item..." footers after
 * the ui5 Grid migration. Covers object and primitive arrays in the enabled,
 * multi-type, read-only and max-reached states. Insert menus and disabled
 * tooltips stay closed. `useTelemetry` falls back to its no-op logger outside
 * a TelemetryProvider.
 */
export function ArrayAddButtonsStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <ArrayAddButtons />
    </TestWrapper>
  )
}
