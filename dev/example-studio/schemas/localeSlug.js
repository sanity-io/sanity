import {SUPPORTED_LANGUAGES} from './languages'

export default {
  type: 'object',
  name: 'localeSlug',
  fields: SUPPORTED_LANGUAGES.map((lang) => ({
    name: lang.id,
    type: 'slug',
    title: lang.title,
    options: {
      source: (document) => (document && document.title ? document.title[lang.id] : ''),
      maxLength: 96,
      auto: true,
    },
  })),
}
