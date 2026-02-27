// oxlint-disable react-hooks/rules-of-hooks
import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, defineArrayMember, defineField, defineType} from '@sanity/types'
import {toString} from '@sanity/util/paths'
import {firstValueFrom, map, toArray} from 'rxjs'
import {expect, it as baseIt, vi, assert} from 'vitest'

import {
  type PrepareFormState,
  type RootFormStateOptions,
  createPrepareFormState,
} from '../../form/store/formState'
import {readOrderedFormMembers} from './readOrderedFormMembers'

const schemaDefinition = {
  name: 'default',
  types: [
    defineType({
      name: 'test',
      type: 'document',
      fields: [
        defineField({
          name: 'name',
          type: 'string',
        }),
        defineField({
          name: 'bio',
          type: 'string',
        }),
        defineField({
          name: 'links',
          type: 'object',
          fields: [
            defineField({
              name: 'bluesky',
              type: 'string',
            }),
            defineField({
              name: 'rss',
              type: 'url',
            }),
          ],
        }),
        defineField({
          name: 'friends',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'friend',
              type: 'object',
              fields: [
                defineField({
                  name: 'name',
                  type: 'string',
                }),
                defineField({
                  name: 'gridPosition',
                  type: 'number',
                }),
              ],
            }),
          ],
        }),
        defineField({
          name: 'profileColors',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'string',
            }),
          ],
        }),
      ],
    }),
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
      fields: [
        defineField({
          name: 'title',
          type: 'string',
        }),
        defineField({
          name: 'metadata',
          type: 'object',
          groups: [
            {
              name: 'seo',
            },
            {
              name: 'urls',
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
      name: 'testGrouplessFields',
      type: 'document',
      groups: [
        {
          name: 'existentGroup',
        },
      ],
      fields: [
        defineField({
          name: 'inExistentGroup',
          type: 'string',
          group: 'existentGroup',
        }),
        defineField({
          name: 'inNoGroup',
          type: 'string',
        }),
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

it('emits members in the order they appear', async ({prepareFormState, schema}) => {
  const documentValue = {
    _type: 'test',
    name: 'Portia',
    bio: 'A spider',
    links: {
      bluesky: 'portia.nest',
      rss: 'https://portia.nest/feed',
    },
    friends: [
      {
        _key: 'x',
        _type: 'friend',
        name: 'x',
        gridPosition: 0,
      },
      {
        _key: 'y',
        _type: 'friend',
        name: 'y',
        gridPosition: 1,
      },
    ],
    profileColors: ['oklch(0.7 0.25 330)', 'oklch(0.6 0.28 310)', 'oklch(0.78 0.05 220)'],
  }

  const formState = prepareFormState({
    ...defaultOptions,
    schemaType: schema.get('test') as ObjectSchemaType,
    documentValue,
    comparisonValue: documentValue,
  })

  assert(formState !== null)

  const result = await firstValueFrom(
    readOrderedFormMembers({
      groups: formState.groups,
      members: formState._allMembers,
    }).pipe(
      map(([path]) => toString(path)),
      toArray(),
    ),
  )

  expect(result).toEqual([
    'name',
    'bio',
    'links',
    'links.bluesky',
    'links.rss',
    'friends',
    'friends[_key=="x"]',
    'friends[_key=="x"].name',
    'friends[_key=="x"].gridPosition',
    'friends[_key=="y"]',
    'friends[_key=="y"].name',
    'friends[_key=="y"].gridPosition',
    'profileColors',
    'profileColors[0]',
    'profileColors[1]',
    'profileColors[2]',
  ])
})

it('emits members each time they appear in a group', async ({prepareFormState, schema}) => {
  const documentValue = {}

  const formState = prepareFormState({
    ...defaultOptions,
    schemaType: schema.get('testGroups') as ObjectSchemaType,
    documentValue,
    comparisonValue: documentValue,
  })

  assert(formState !== null)

  const result = await firstValueFrom(
    readOrderedFormMembers({
      groups: formState.groups,
      members: formState._allMembers,
    }).pipe(
      map(([path]) => toString(path)),
      toArray(),
    ),
  )

  expect(result).toEqual(['description', 'title', 'description'])
})

it(`emits members that don't belong to any existent group`, async ({prepareFormState, schema}) => {
  const documentValue = {}

  const formState = prepareFormState({
    ...defaultOptions,
    schemaType: schema.get('testGrouplessFields') as ObjectSchemaType,
    documentValue,
    comparisonValue: documentValue,
  })

  assert(formState !== null)

  const result = await firstValueFrom(
    readOrderedFormMembers({
      groups: formState.groups,
      members: formState._allMembers,
    }).pipe(
      map(([path]) => toString(path)),
      toArray(),
    ),
  )

  expect(result).toEqual(['inNoGroup', 'inExistentGroup'])
})

it('emits members that appear in nested groups', async ({prepareFormState, schema}) => {
  const documentValue = {}

  const formState = prepareFormState({
    ...defaultOptions,
    schemaType: schema.get('testNestedGroups') as ObjectSchemaType,
    documentValue,
    comparisonValue: documentValue,
  })

  assert(formState !== null)

  const result = await firstValueFrom(
    readOrderedFormMembers({
      groups: formState.groups,
      members: formState._allMembers,
    }).pipe(
      map(([path]) => toString(path)),
      toArray(),
    ),
  )

  expect(result).toEqual(['title', 'metadata', 'metadata.description', 'metadata.canonicalUrl'])
})
