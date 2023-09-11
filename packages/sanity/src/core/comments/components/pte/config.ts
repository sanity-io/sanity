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
