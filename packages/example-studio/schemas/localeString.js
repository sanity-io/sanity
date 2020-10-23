import {SUPPORTED_LANGUAGES} from './languages'

export default {
  type: 'object',
  name: 'localeString',
  fields: SUPPORTED_LANGUAGES.map((lang) => ({
    name: lang.id,
    type: 'string',
    title: lang.title,
  })),
}
