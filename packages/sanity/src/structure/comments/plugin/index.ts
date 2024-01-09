import {commentsUsEnglishLocaleBundle} from '../i18n'
import {commentsInspector} from './inspector'
import {CommentsField} from './field'
import {CommentsDocumentLayout} from './document-layout'
import {CommentsStudioLayout} from './studio-layout'
import {CommentsInput} from './input'
import {definePlugin} from 'sanity'

export const comments = definePlugin({
  name: 'sanity/structure/comments',

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
