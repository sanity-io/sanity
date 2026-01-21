import {definePlugin} from '../../config/definePlugin'
import {commentsUsEnglishLocaleBundle} from '../i18n'
import {CommentsDocumentLayout} from './document-layout/CommentsDocumentLayout'
import {CommentsField} from './field/CommentsField'
import {CommentsInput} from './input/CommentsInput'
import {commentsInspector} from './inspector'
import {CommentsStudioLayout} from './studio-layout/CommentsStudioLayout'

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
