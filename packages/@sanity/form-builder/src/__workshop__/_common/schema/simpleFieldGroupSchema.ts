import {CogIcon} from '@sanity/icons'
import {WorkshopSchemaProps, wrapSchema} from '../data'

export default function getSchema(props: WorkshopSchemaProps) {
  const {hiddenGroup = false} = props

  return wrapSchema({
    name: 'dummy',
    title: 'Basic groups',
    type: 'document',
    groups: [
      {
        name: 'group1',
        title: 'Group 1',
        icon: CogIcon,
        hidden: hiddenGroup,
      },
      {
        name: 'group2',
        title: 'Group 2',
      },
      {
        name: 'group3',
        title:
          'Group 3 - with a very long name. How will it behave? It should not overflow the pane, but wrap.',
      },
    ],
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
      },
      {name: 'field1', type: 'string', group: 'group1'},
      {name: 'field2', type: 'string', group: 'group2'},
      {name: 'field3', type: 'string'},
      {name: 'field4', type: 'string', group: ['group1', 'group2']},
      {
        name: 'fieldGroup',
        type: 'object',
        group: 'group1',
        fields: [
          {
            name: 'groupField1',
            type: 'string',
          },
          {
            name: 'groupField2',
            type: 'string',
          },
        ],
      },
      {name: 'field5', type: 'string', group: 'group3'},
    ],
  })
}
