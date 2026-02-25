// oxlint-disable react-hooks/rules-of-hooks
import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, defineField, defineType} from '@sanity/types'
import {it as baseIt, expect, vi} from 'vitest'

import {
  type PrepareFormState,
  type RootFormStateOptions,
  createPrepareFormState,
} from '../../formState'
import {type BaseFormNode} from '../../types'
import {getExpandOperations} from '../getExpandOperations'

const schemaDefinition = {
  name: 'default',
  types: [
    defineType({
      name: 'testGroups',
      type: 'document',
      groups: [
        {
          name: 'groupA',
        },
        {
          name: 'groupB',
        },
        {
          name: 'groupC',
          default: true,
        },
      ],
      fields: [
        defineField({
          name: 'title',
          type: 'string',
          group: 'groupB',
        }),
        defineField({
          name: 'description',
          type: 'string',
          group: ['groupA', 'groupC'],
        }),
      ],
    }),
    defineType({
      name: 'testNestedGroups',
      type: 'document',
      groups: [
        {
          name: 'alpha',
        },
        {
          name: 'beta',
          default: true,
        },
      ],
      fields: [
        defineField({
          name: 'title',
          type: 'string',
          group: 'beta',
        }),
        defineField({
          name: 'metadata',
          type: 'object',
          group: 'alpha',
          groups: [
            {
              name: 'seo',
            },
            {
              name: 'urls',
              default: true,
            },
          ],
          fields: [
            defineField({
              name: 'canonicalUrl',
              type: 'url',
              group: 'urls',
            }),
            defineField({
              name: 'description',
              type: 'string',
              group: 'seo',
            }),
          ],
        }),
      ],
    }),
    defineType({
      name: 'nestedGroupInArrayObjectNode',
      type: 'document',
      fields: [
        {
          name: 'objectArray',
          type: 'array',
          of: [
            {
              type: 'object',
              groups: [
                {
                  name: 'alpha',
                },
                {
                  name: 'beta',
                  default: true,
                },
              ],
              fields: [
                {
                  name: 'stringAlpha',
                  type: 'string',
                  group: 'alpha',
                },
                {
                  name: 'stringBeta',
                  type: 'string',
                  group: 'beta',
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
}

const defaultOptions: Omit<
  RootFormStateOptions,
  'schemaType' | 'documentValue' | 'comparisonValue'
> = {
  currentUser: {
    email: 'ada@sanity.io',
    id: 'x',
    name: 'Ada',
    roles: [],
  },
  focusPath: [],
  openPath: [],
  presence: [],
  validation: [],
  changesOpen: false,
  collapsedFieldSets: {},
  collapsedPaths: {},
  fieldGroupState: {},
  hidden: undefined,
  readOnly: undefined,
  perspective: 'published',
  hasUpstreamVersion: true,
}

const it = baseIt.extend<{
  prepareFormState: PrepareFormState
  schema: ReturnType<typeof Schema.compile>
}>({
  // oxlint-disable-next-line no-empty-pattern
  prepareFormState: async ({}, use) => {
    await use(
      createPrepareFormState({
        decorators: {
          prepareArrayOfObjectsInputState: vi.fn,
          prepareArrayOfObjectsMember: vi.fn,
          prepareArrayOfPrimitivesInputState: vi.fn,
          prepareArrayOfPrimitivesMember: vi.fn,
          prepareFieldMember: vi.fn,
          prepareObjectInputState: vi.fn,
          preparePrimitiveInputState: vi.fn,
        },
      }),
    )
  },
  // oxlint-disable-next-line no-empty-pattern
  schema: async ({}, use) => {
    await use(Schema.compile(schemaDefinition))
  },
})

it('switches to group the node belongs to', ({prepareFormState, schema}) => {
  const documentValue = {}

  const formState = prepareFormState({
    ...defaultOptions,
    schemaType: schema.get('testGroups') as ObjectSchemaType,
    documentValue,
    comparisonValue: documentValue,
  }) as BaseFormNode

  expect(getExpandOperations(formState, ['title'])).toMatchInlineSnapshot(`
    [
      {
        "path": [
          "title",
        ],
        "type": "expandPath",
      },
      {
        "groupName": "groupB",
        "path": [],
        "type": "setSelectedGroup",
      },
    ]
  `)
})

it('switches to nested group the node belongs to', ({prepareFormState, schema}) => {
  const documentValue = {}

  const formState = prepareFormState({
    ...defaultOptions,
    schemaType: schema.get('testNestedGroups') as ObjectSchemaType,
    documentValue,
    comparisonValue: documentValue,
  }) as BaseFormNode

  expect(getExpandOperations(formState, ['metadata', 'description'])).toMatchInlineSnapshot(`
      [
        {
          "path": [
            "metadata",
          ],
          "type": "expandPath",
        },
        {
          "path": [
            "metadata",
            "description",
          ],
          "type": "expandPath",
        },
        {
          "groupName": "alpha",
          "path": [],
          "type": "setSelectedGroup",
        },
        {
          "groupName": "seo",
          "path": [
            "metadata",
          ],
          "type": "setSelectedGroup",
        },
      ]
    `)
})

it('switches to group the array object node belongs to, and nested group the object node belongs to', ({
  prepareFormState,
  schema,
}) => {
  const documentValue = {
    objectArray: [
      {
        _key: 'x',
        stringAlpha: 'alpha',
      },
    ],
  }

  const formState = prepareFormState({
    ...defaultOptions,
    schemaType: schema.get('nestedGroupInArrayObjectNode') as ObjectSchemaType,
    documentValue,
    comparisonValue: documentValue,
  }) as BaseFormNode

  expect(getExpandOperations(formState, ['objectArray', {_key: 'x'}, 'stringAlpha']))
    .toMatchInlineSnapshot(`
      [
        {
          "path": [
            "objectArray",
          ],
          "type": "expandPath",
        },
        {
          "path": [
            "objectArray",
            {
              "_key": "x",
            },
          ],
          "type": "expandPath",
        },
        {
          "path": [
            "objectArray",
            {
              "_key": "x",
            },
            "stringAlpha",
          ],
          "type": "expandPath",
        },
        {
          "groupName": "all-fields",
          "path": [],
          "type": "setSelectedGroup",
        },
        {
          "groupName": "alpha",
          "path": [
            "objectArray",
            {
              "_key": "x",
            },
          ],
          "type": "setSelectedGroup",
        },
      ]
    `)
})
