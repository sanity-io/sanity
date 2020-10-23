export default {
  name: 'typeWithNoToplevelStrings',
  type: 'document',
  title: 'Type without strings',
  description: `This is an example of a type that has no meaningful top level strings.
   It is used to test/demonstrate that reference search also includes deeper fields`,
  fields: [
    {
      name: 'localizedTitle',
      title: 'Localized title',
      type: 'object',
      fieldsets: [{name: 'other', title: 'Translations'}],
      fields: [
        {name: 'no', type: 'string', title: 'Norwegian (Bokmål)'},
        {name: 'nn', type: 'string', title: 'Norwegian (Nynorsk)', fieldset: 'other'},
        {name: 'se', type: 'string', title: 'Swedish', fieldset: 'other'},
      ],
    },
    {
      name: 'name',
      title: "Name field (can't be sorted)",
      type: 'object',
      fieldsets: [{name: 'other', title: 'Translations'}],
      fields: [
        {name: 'no', type: 'string', title: 'Norwegian (Bokmål)'},
        {name: 'nn', type: 'string', title: 'Norwegian (Nynorsk)', fieldset: 'other'},
        {name: 'se', type: 'string', title: 'Swedish', fieldset: 'other'},
      ],
    },
    {
      name: 'externalId',
      title: 'External id',
      type: 'string',
    },
  ],
}
