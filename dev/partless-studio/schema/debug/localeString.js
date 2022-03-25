const supportedLanguages = [
  {title: 'English', id: 'en', isDefault: true},
  {title: 'Norwegian', id: 'nb'},
  {title: 'Swedish', id: 'se'},
]

export default {
  name: 'localeString',
  type: 'object',
  fieldsets: [
    {
      title: 'Translations',
      name: 'translations',
      options: {collapsible: true},
    },
  ],
  fields: supportedLanguages.map((lang) => ({
    title: lang.title,
    name: lang.id,
    type: 'string',
    validation: lang.isDefault ? (Rule) => Rule.required() : null,
    fieldset: lang.isDefault ? null : 'translations',
  })),
}
