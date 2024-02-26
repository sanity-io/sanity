const linkType = {
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    },
  ],
  validation: (Rule) => Rule.required(),
}

const myStringType = {
  type: 'object',
  name: 'test',
  fields: [{type: 'string', name: 'mystring', validation: (Rule) => Rule.required()}],
}

export const customBlock = {
  name: 'customHoistedBlock',
  type: 'block',
  title: 'A named custom block',
  marks: {
    annotations: [linkType, myStringType],
  },
  of: [
    {type: 'image'},
    {
      type: 'object',
      name: 'test',
      fields: [myStringType],
    },
    {
      type: 'reference',
      name: 'strongAuthorRef',
      title: 'A strong author ref',
      to: {type: 'author'},
      options: {
        modal: {
          type: 'popover',
          width: 1,
        },
      },
    },
  ],
}

export const hoistedPt = {
  name: 'hoistedPt',
  type: 'array',
  title: 'Hoisted PT array',
  of: [{type: 'customHoistedBlock'}],
}

export const hoistedPtDocument = {
  type: 'document',
  name: 'documentWithHoistedPt',
  title: 'Hoisted PT document',
  fields: [
    {
      type: 'hoistedPt',
      name: 'body',
    },
  ],
}
