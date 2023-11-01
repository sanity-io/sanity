import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField} from '@sanity/types'

/**
 * @beta
 * @hidden
 */
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

/**
 * @beta
 * @hidden
 */
export const editorSchemaType = schema.get('body')
