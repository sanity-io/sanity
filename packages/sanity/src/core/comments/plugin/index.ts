import {lazy} from 'react'

import {definePlugin} from '../../config'
import {commentsUsEnglishLocaleBundle} from '../i18n'
import {commentsInspector} from './inspector'

const CommentsDocumentLayout = lazy(() =>
  import('./document-layout').then((module) => ({default: module.CommentsDocumentLayout})),
)
const CommentsField = lazy(() =>
  import('./field').then((module) => ({default: module.CommentsField})),
)
const CommentsInput = lazy(() =>
  import('./input').then((module) => ({default: module.CommentsInput})),
)
const CommentsStudioLayout = lazy(() =>
  import('./studio-layout').then((module) => ({default: module.CommentsStudioLayout})),
)

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
