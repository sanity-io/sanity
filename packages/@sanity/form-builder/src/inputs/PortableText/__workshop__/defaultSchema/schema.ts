import {createSchema} from '@sanity/base/schema'

const ptType = {
  type: 'array',
  name: 'body',
  of: [{type: 'block'}],
}

export const schema = createSchema({
  name: 'default',
  types: [ptType],
})

export const portableTextType = schema.get('body')
