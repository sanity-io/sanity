import {ConfettiIcon} from '@sanity/icons'
import {Card, Text} from '@sanity/ui'
import {type DecorationMember, defineField, defineType} from 'sanity'

export function Decoration({title}: {title: string}) {
  return (
    <Card padding={2} paddingY={3} radius={2} border>
      <Text>
        <ConfettiIcon />
        {'  '} {title} {'  '} <ConfettiIcon />
      </Text>
    </Card>
  )
}

export const decorations = defineType({
  type: 'document',
  name: 'decorations',
  fieldsets: [
    {
      name: 'settings',
      title: 'Settings',
    },
  ],
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'object',
      name: 'location',
      title: 'Location',
      fields: [
        defineField({
          type: 'string',
          name: 'city',
          title: 'City',
        }),
        defineField({
          type: 'string',
          name: 'country',
          title: 'Country',
        }),
      ],
      renderMembers: (members) => {
        return [
          {
            key: 'decoration',
            kind: 'decoration',
            component: () => <Decoration title={'This is inside an object'} />,
          },
          ...members,
        ]
      },
    }),
    defineField({
      type: 'string',
      name: 'description',
      title: 'Description',
      fieldset: 'settings',
    }),
    defineField({
      type: 'string',
      name: 'color',
      title: 'Color',
      fieldset: 'settings',
    }),
    defineField({
      type: 'string',
      name: 'fontSize',
      title: 'Font Size',
      fieldset: 'settings',
    }),
  ],
  renderMembers: (members) => {
    return [
      {
        key: 'decoration',
        kind: 'decoration',
        component: () => <Decoration title={'This is a fancy decorated schema type!'} />,
      },
      ...members.map((member) => {
        if (member.kind === 'fieldSet') {
          return {
            ...member,
            fieldSet: {
              ...member.fieldSet,
              members: [
                ...member.fieldSet.members,
                {
                  key: 'decoration',
                  kind: 'decoration',
                  component: () => <Decoration title={'This is a fieldset decoration!'} />,
                } as DecorationMember,
              ],
            },
          }
        }
        return member
      }),
    ]
  },
})
