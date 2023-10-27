import {BoldIcon, ItalicIcon, LinkIcon} from '@sanity/icons'
import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField} from '@sanity/types'

export const mentionObject = defineField({
  name: 'mention',
  type: 'object',
  fields: [
    {
      name: 'userId',
      type: 'string',
    },
  ],
})

const blockType = defineField({
  type: 'block',
  name: 'block',
  of: [mentionObject],
  styles: [{title: 'Normal', value: 'normal'}],
  lists: [],
  marks: {
    decorators: [
      {
        title: 'Strong',
        value: 'strong',
        icon: BoldIcon,
      },
      {
        title: 'Emphasis',
        value: 'em',
        icon: ItalicIcon,
      },
    ],
    annotations: [
      {
        type: 'object',
        name: 'link',
        icon: LinkIcon,
        fields: [
          {
            name: 'href',
            type: 'url',
            title: 'Link',
            description: 'A valid web, email, phone, or relative link.',
            validation: (Rule) =>
              Rule.uri({
                scheme: ['http', 'https', 'tel', 'mailto'],
                allowRelative: true,
              }),
          },
        ],
      },
    ],
  },
})

const portableTextType = defineArrayMember({
  type: 'array',
  name: 'body',
  of: [blockType],
})

const schema = Schema.compile({
  name: 'comments',
  types: [portableTextType],
})

export const editorSchemaType = schema.get('body')
