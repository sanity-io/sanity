import Schema from '@sanity/schema'

const ptType = {
  type: 'array',
  name: 'body',
  of: [{type: 'block'}],
}

export const schema = Schema.compile({
  name: 'default',
  types: [ptType],
})

export const portableTextType = schema.get('body')
