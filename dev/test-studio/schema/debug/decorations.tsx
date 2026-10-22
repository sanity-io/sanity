import {ConfettiIcon} from '@sanity/icons/Confetti'
import {Card} from '@sanity/ui'
import {defineField, defineType} from 'sanity'
import {Icon, Text} from 'ui5'

export function Decoration({title}: {title: string}) {
  return (
    <Card padding={2} paddingY={3} radius={2} border>
      <Text trim={true}>
        <Icon icon={ConfettiIcon} style={{margin: '-0.4375rem'}} />
        {'  '} {title} {'  '}
        <Icon icon={ConfettiIcon} style={{margin: '-0.4375rem'}} />
      </Text>
    </Card>
  )
}

export const decorations = defineType({
  type: 'document',
  name: 'decorations',
  icon: 'hey',
  fieldsets: [
    {
      name: 'settings',
      title: 'Settings',
      renderMembers: (members) => {
        return [
          ...members,
          {
            key: 'decoration',
            kind: 'decoration',
            component: () => <Decoration title={'This is inside a fieldset'} />,
          },
        ]
      },
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
        defineField({
          type: 'image',
          name: 'image',
          title: 'Image',
          fields: [
            defineField({
              type: 'string',
              name: 'url',
              title: 'URL',
            }),
          ],
          renderMembers: (members) => {
            return [
              {
                key: 'imageDecoration',
                kind: 'decoration',
                component: () => <Decoration title={'This is a image decoration!'} />,
              },
              ...members,
            ]
          },
        }),
        defineField({
          type: 'file',
          name: 'file',
          title: 'File',
          fields: [
            defineField({
              type: 'string',
              name: 'url',
              title: 'URL',
            }),
          ],
          renderMembers: (members) => {
            return [
              {
                key: 'fileDecoration',
                kind: 'decoration',
                component: <Decoration title={'This is a file decoration!'} />,
              },
              ...members,
            ]
          },
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
      ...members,
    ]
  },
})
