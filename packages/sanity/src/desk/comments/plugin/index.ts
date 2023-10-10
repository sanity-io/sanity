import {commentsInspector} from './inspector'
import {CommentField} from './field'
import {definePlugin} from 'sanity'

export const comments = definePlugin({
  name: 'sanity/desk/comments',
  document: {
    inspectors: [commentsInspector],
  },
  form: {
    components: {
      field: CommentField,
    },
  },
})
