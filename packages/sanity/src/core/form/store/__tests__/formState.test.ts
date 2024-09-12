import {beforeEach, expect, it, jest} from '@jest/globals'
import {type CurrentUser, defineField, defineType, type ObjectSchemaType} from '@sanity/types'

import {createSchema} from '../../../schema/createSchema'
import {
  createCallbackResolver,
  type RootCallbackResolver,
} from '../conditional-property/createCallbackResolver'
import {createPrepareFormState, type PrepareFormState} from '../formState'

let prepareFormState!: PrepareFormState
let prepareHiddenState!: RootCallbackResolver<'hidden'>
let prepareReadOnlyState!: RootCallbackResolver<'readOnly'>

beforeEach(() => {
  prepareFormState = createPrepareFormState({
    decorators: {
      prepareArrayOfObjectsInputState: jest.fn,
      prepareArrayOfObjectsMember: jest.fn,
      prepareArrayOfPrimitivesInputState: jest.fn,
      prepareArrayOfPrimitivesMember: jest.fn,
      prepareFieldMember: jest.fn,
      prepareObjectInputState: jest.fn,
      preparePrimitiveInputState: jest.fn,
    },
  })
  prepareHiddenState = createCallbackResolver({property: 'hidden'})
  prepareReadOnlyState = createCallbackResolver({property: 'readOnly'})
})

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'testDocument',
      type: 'document',
      title: 'Test Document',
      fields: [
        defineField({
          name: 'title',
          type: 'string',
          title: 'Title',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'simpleObject',
          type: 'object',
          title: 'Simple ',
          fields: [
            {name: 'field1', type: 'string', title: 'Field 1'},
            {name: 'field2', type: 'number', title: 'Field 2'},
          ],
        }),
        defineField({
          name: 'arrayOfPrimitives',
          type: 'array',
          title: ' of Primitives',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'arrayOfObjects',
          type: 'array',
          title: ' of Objects',
          of: [
            {
              type: 'object',
              name: 'arrayObject',
              fields: [
                defineField({name: 'objectTitle', type: 'string', title: ' Title'}),
                defineField({name: 'objectValue', type: 'number', title: ' Value'}),
              ],
            },
          ],
        }),
        defineField({
          name: 'nestedObject',
          type: 'object',
          title: 'Nested ',
          fields: [
            defineField({name: 'nestedField1', type: 'string', title: 'Nested Field 1'}),
            defineField({
              name: 'nestedObject',
              type: 'object',
              title: 'Nested ',
              fields: [
                defineField({
                  name: 'deeplyNestedField',
                  type: 'string',
                  title: 'Deeply Nested Field',
                }),
              ],
            }),
            defineField({
              name: 'nestedArray',
              type: 'array',
              title: 'Nested ',
              of: [{type: 'string'}],
            }),
          ],
        }),
        defineField({
          name: 'conditionalField',
          type: 'string',
          title: 'Conditional Field',
          hidden: ({document}) => !document?.title,
        }),
        defineField({
          name: 'fieldWithValidation',
          type: 'string',
          title: 'Field with Validation',
          validation: (Rule) => Rule.min(5).max(10),
        }),
        defineField({
          name: 'fieldsetField1',
          type: 'string',
          title: 'Fieldset Field 1',
          fieldset: 'testFieldset',
        }),
        defineField({
          name: 'fieldsetField2',
          type: 'number',
          title: 'Fieldset Field 2',
          fieldset: 'testFieldset',
        }),
      ],
      fieldsets: [
        {
          name: 'testFieldset',
          title: 'Test Fieldset',
          options: {collapsible: true, collapsed: false},
        },
      ],
    }),
  ],
})

const schemaType = schema.get('testDocument') as ObjectSchemaType

const currentUser: Omit<CurrentUser, 'role'> = {
  email: 'rico@sanity.io',
  id: 'exampleId',
  name: 'Rico Kahler',
  roles: [],
}

const value = {
  _type: 'testDocument',
  title: 'Example Test Document',
  simpleObject: {
    field1: 'Simple  String',
    field2: 42,
  },
  arrayOfPrimitives: ['First string', 'Second string', 'Third string'],
  arrayOfObjects: [
    {
      _type: 'arrayObject',
      _key: 'object0',
      objectTitle: 'First ',
      objectValue: 10,
    },
    {
      _type: 'arrayObject',
      _key: 'object1',
      objectTitle: 'Second ',
      objectValue: 20,
    },
  ],
  nestedObject: {
    nestedField1: 'Nested Field Value',
    nestedObject: {
      deeplyNestedField: 'Deeply Nested Value',
    },
    nestedArray: ['Nested  Item 1', 'Nested  Item 2'],
  },
  conditionalField: 'This field is visible',
  fieldWithValidation: 'Valid',
  fieldsetField1: 'Fieldset String Value',
  fieldsetField2: 99,
}

it('creates the root form node', () => {
  const result = prepareFormState({
    currentUser,
    focusPath: [],
    level: 0,
    openPath: [],
    path: [],
    presence: [],
    schemaType,
    validation: [],
    changed: false,
    changesOpen: false,
    collapsedFieldSets: {},
    collapsedPaths: {},
    value,
    comparisonValue: null,
    fieldGroupState: {},
    hidden: prepareHiddenState({
      currentUser,
      document: value,
      schemaType,
    }),
    readOnly: prepareReadOnlyState({
      currentUser,
      document: value,
      schemaType,
    }),
  })

  expect(prepareFormState.prepareArrayOfObjectsInputState).toHaveBeenCalledTimes(1)
  expect(prepareFormState.prepareArrayOfObjectsMember).toHaveBeenCalledTimes(2)
  expect(prepareFormState.prepareArrayOfPrimitivesInputState).toHaveBeenCalledTimes(2)
  expect(prepareFormState.prepareArrayOfPrimitivesMember).toHaveBeenCalledTimes(5)
  expect(prepareFormState.prepareFieldMember).toHaveBeenCalledTimes(19)
  expect(prepareFormState.prepareObjectInputState).toHaveBeenCalledTimes(6)
  expect(prepareFormState.preparePrimitiveInputState).toHaveBeenCalledTimes(18)

  expect(result).toMatchObject({
    changed: true,
    focusPath: [],
    focused: true,
    groups: [],
    id: '',
    level: 0,
    members: [
      {
        key: 'field-title',
        kind: 'field',
      },
      {
        key: 'field-simpleObject',
        kind: 'field',
      },
      {
        key: 'field-arrayOfPrimitives',
        kind: 'field',
      },
      {
        key: 'field-arrayOfObjects',
        kind: 'field',
      },
      {
        key: 'field-nestedObject',
        kind: 'field',
      },
      {
        key: 'field-conditionalField',
        kind: 'field',
      },
      {
        key: 'field-fieldWithValidation',
        kind: 'field',
      },
      {
        key: 'fieldset-testFieldset',
        kind: 'fieldSet',
      },
    ],
    path: [],
    presence: [],
    readOnly: undefined,
    validation: [],
    schemaType,
    value,
  })
})

it.todo('does not recompute nodes that have not changed')
