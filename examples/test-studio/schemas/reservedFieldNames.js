const RESERVED_KEYWORDS = ['desc', 'match', 'in', 'asc', 'true', 'false', 'null']

export default {
  type: 'document',
  name: 'reservedKeywordsTest',
  fields: [
    ...RESERVED_KEYWORDS.map((kw) => ({name: kw, type: 'string'})),
    {name: 'reference', type: 'reference', to: [{type: 'reservedKeywordsTest'}]},
    {name: 'totallyValid', type: 'string'},
    {
      name: 'nested',
      type: 'object',
      fields: [
        ...RESERVED_KEYWORDS.map((kw) => ({name: kw, type: 'string'})),
        {name: 'totallyValid', type: 'string'},
      ],
    },
  ],
}
