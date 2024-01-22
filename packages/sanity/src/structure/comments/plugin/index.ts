import {commentsInspector} from './inspector'
import {CommentsField} from './field'
import {CommentsDocumentLayout} from './document-layout'
import {CommentsStudioLayout} from './studio-layout'
import {CommentsBlock} from './block'
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
      block: CommentsBlock,
      field: CommentsField,
    },
  },

  studio: {
    components: {
      layout: CommentsStudioLayout,
    },
  },
})
