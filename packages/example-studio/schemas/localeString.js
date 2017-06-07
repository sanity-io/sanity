const SUPPORTED_LANGUAGES = [
  {id: 'nb', title: 'Norwegian (Bokmål)', default: true},
  {id: 'nn', title: 'Norwegian (Nynorsk)'},
  {id: 'en', title: 'English'},
  {id: 'de', title: 'German'}
]

export default {
  type: 'object',
  name: 'localeString',
  fieldsets: [
    {name: 'translations', title: 'Translations', options: {collapsable: true}}
  ],
  fields: SUPPORTED_LANGUAGES.map(lang => (
    {
      name: lang.id,
      type: 'string',
      title: lang.title,
      fieldset: lang.default ? null : 'translations'
    }
  ))
}
