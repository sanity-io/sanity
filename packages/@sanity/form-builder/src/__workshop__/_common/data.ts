import Schema from '@sanity/schema'
import type {Schema as SchemaSchema} from '@sanity/types'

export const DUMMY_DOCUMENT_ID = '10053a07-8647-4ebd-9d1d-33a512d30d3a'

export function getDummyDocument() {
  return {
    _createdAt: '2021-11-04T15:41:48Z',
    _id: DUMMY_DOCUMENT_ID,
    _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
    _type: 'book',
    _updatedAt: '2021-11-05T12:34:29Z',
    title: 'Hello world',
    person: {
      name: 'Fred',
    },
  }
}

interface DummySchemaProps {
  hiddenGroup?: boolean
}

export function getDummySchema(props?: DummySchemaProps): SchemaSchema {
  const {hiddenGroup = false} = props

  return Schema.compile({
    name: 'test',
    types: [
      {
        name: 'book',
        type: 'document',
        groups: [
          {
            name: 'group1',
            title: 'Group 1',
            hidden: hiddenGroup,
          },
        ],
        fields: [
          {
            name: 'title',
            title: 'Title',
            type: 'string',
          },
          {
            name: 'person',
            type: 'object',
            group: ['group1'],
            fieldsets: [
              {
                name: 'social',
                title: 'Social media handles [collapsed by default]',
                options: {collapsible: true, collapsed: true},
              },
            ],
            groups: [
              {
                name: 'instagram',
                title: 'Instagram',
              },
            ],
            fields: [
              {
                name: 'name',
                title: 'Name',
                type: 'string',
              },
              {
                name: 'twitter',
                title: 'Twitter',
                type: 'string',
                fieldset: 'social',
                validation: (Rule) => Rule.required(),
              },
              {
                name: 'instagram',
                title: 'Instagram',
                type: 'string',
                fieldset: 'social',
                group: ['instagram'],
              },
              {
                name: 'facebook',
                title: 'Facebook',
                type: 'string',
                fieldset: 'social',
              },
            ],
          },
        ],
      },
    ],
  })
}
