import {SUPPORTED_LANGUAGES} from './languages'

export default {
  name: 'localeBlockContent',
  type: 'object',
  fields: SUPPORTED_LANGUAGES.map((lang) => ({
    title: lang.title,
    name: lang.id,
    type: 'blockContent',
  })),
}
