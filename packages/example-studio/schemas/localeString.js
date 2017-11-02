import {SUPPORTED_LANGUAGES} from './languages'

export default {
  type: 'object',
  name: 'localeString',
  fieldsets: [{name: 'translations', title: 'Translations', options: {collapsable: true}}],
  fields: SUPPORTED_LANGUAGES.map(lang => (
    {
      name: lang.id,
      type: 'string',
      title: lang.title,
      fieldset: lang.default ? null : 'translations'
    }
  ))
}
