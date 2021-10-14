export const customBlock = {
  name: 'customHoistedBlock',
  type: 'block',
  title: 'A named custom block',
  marks: {
    annotations: [
      {type: 'object', name: 'link', fields: [{type: 'string', name: 'url'}]},
      {type: 'object', name: 'test', fields: [{type: 'string', name: 'mystring'}]},
    ],
  },
  of: [
    {type: 'image'},
    {
      type: 'object',
      name: 'test',
      fields: [{type: 'string', name: 'mystring', validation: (Rule) => Rule.required()}],
    },
    {
      type: 'reference',
      name: 'strongAuthorRef',
      title: 'A strong author ref',
      to: {type: 'author'},
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
