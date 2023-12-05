import {commentsInspector} from './inspector'
import {CommentsField} from './field'
import {CommentsFormLayout} from './form-layout'
import {CommentsStudioLayout} from './studio-layout'
import {definePlugin} from 'sanity'

export const comments = definePlugin({
  name: 'sanity/desk/comments',
  document: {
    inspectors: [commentsInspector],
  },

  form: {
    components: {
      field: CommentsField,
      layout: CommentsFormLayout,
    },
  },

  studio: {
    components: {
      layout: CommentsStudioLayout,
    },
  },
})
