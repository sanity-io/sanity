import {definePlugin} from 'sanity'

import {commentsUsEnglishLocaleBundle} from '../i18n'
import {CommentsDocumentLayout} from './document-layout'
import {CommentsField} from './field'
import {commentsInspector} from './inspector'
import {CommentsStudioLayout} from './studio-layout'

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
    },
  },

  studio: {
    components: {
      layout: CommentsStudioLayout,
    },
  },

  i18n: {bundles: [commentsUsEnglishLocaleBundle]},
})
