import {SUPPORTED_LANGUAGES} from './languages'

export default {
  type: 'object',
  name: 'localeSlug',
  fieldsets: [
    {
      name: 'translations',
      title: 'Translations',
      options: { collapsable: true },
    },
  ],
  fields: SUPPORTED_LANGUAGES.map(lang => ({
    name: lang.id,
    type: 'slug',
    title: lang.title,
    fieldset: lang.default ? null : 'translations',
    options: {
      source: document => document.title[lang.id],
      maxLength: 96,
      auto: true,
    },
  })),
}
