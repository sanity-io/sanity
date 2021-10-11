export default {
  title: 'Rich Text',
  name: 'richTextObject',
  type: 'object',
  fields: [
    {
      title: 'Text',
      name: 'text',
      type: 'array',
      of: [{type: 'block'}, {type: 'button'}],
    },
  ],
}
