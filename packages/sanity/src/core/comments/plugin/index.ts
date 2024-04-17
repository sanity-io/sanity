import {definePlugin} from '../../config'
import {commentsUsEnglishLocaleBundle} from '../i18n'
import {CommentsDocumentLayout} from './document-layout'
import {CommentsField} from './field'
import {CommentsInput} from './input'
import {commentsInspector} from './inspector'
import {CommentsStudioLayout} from './studio-layout'

export const comments = definePlugin({
  name: 'sanity/comments',

  document: {
    inspectors: [commentsInspector],
    components: {
      unstable_layout: CommentsDocumentLayout,
    },
  },

  form: {
    components: {
      field: CommentsField,
      input: CommentsInput,
    },
  },

  studio: {
    components: {
      layout: CommentsStudioLayout,
    },
  },

  i18n: {bundles: [commentsUsEnglishLocaleBundle]},
})
