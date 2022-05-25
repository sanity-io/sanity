function extractTextFromBlocks(blocks) {
  if (!blocks) {
    return ''
  }
  return blocks
    .map((block) => {
      return block.children
        .filter((child) => child._type === 'span')
        .map((span) => span.text)
        .join('')
    })
    .join('')
}

const linkType = {
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}).required(),
    },
  ],
  options: {
    modal: {
      type: 'popover',
      width: 'medium',
    },
  },
}

const myStringType = {
  type: 'object',
  name: 'test',
  fields: [{type: 'string', name: 'mystring', validation: (Rule) => Rule.required()}],
}

export default {
  name: 'simpleBlock',
  title: 'Simple block',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [linkType, myStringType],
          },
          of: [
            {type: 'image', name: 'image'},
            myStringType,
            {
              type: 'reference',
              name: 'strongAuthorRef',
              title: 'A strong author ref',
              to: {type: 'author'},
            },
          ],
          validation: (Rule) =>
            Rule.custom((block) => {
              const text = extractTextFromBlocks([block])
              return text.length === 1 ? 'Please write a longer paragraph.' : true
            }),
          options: {
            spellCheck: true,
          },
        },
        {
          type: 'image',
          name: 'image',
          options: {
            modal: {
              // The default `type` of object blocks is 'dialog'
              // type: 'dialog',
              // The default `width` of object blocks is 'medium'
              // width: 'small',
            },
          },
        },
        myStringType,
      ],
    },
    {
      name: 'notes',
      type: 'array',
      of: [
        {
          type: 'simpleBlockNote',
        },
      ],
    },
  ],
}
