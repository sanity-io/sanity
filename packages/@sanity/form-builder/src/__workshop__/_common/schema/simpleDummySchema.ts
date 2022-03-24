import {Rule} from '@sanity/types'
import {WorkshopSchemaProps, wrapSchema} from '../data'

export default function getSchema(props: WorkshopSchemaProps) {
  const {hiddenGroup = false} = props

  return wrapSchema({
    name: 'dummy',
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
            name: 'conditionalName',
            title: 'Name (conditional read only)',
            type: 'string',
            readOnly: ({parent}: any) => parent?.name === 'ro',
          },
          {
            name: 'twitter',
            title: 'Twitter',
            type: 'string',
            fieldset: 'social',
            validation: (rule: Rule) => rule.required(),
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
  })
}
