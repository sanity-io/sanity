import {commentsInspector} from './inspector'
import {CommentsField} from './field'
import {CommentsDocumentLayout} from './document-layout'
import {CommentsStudioLayout} from './studio-layout'
import {definePlugin} from 'sanity'

export const comments = definePlugin({
  name: 'sanity/desk/comments',

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
})
