import {lazy} from 'react'

import {definePlugin} from '../../config/definePlugin'
import {commentsUsEnglishLocaleBundle} from '../i18n'
import {commentsInspector} from './inspector'

const CommentsDocumentLayout = lazy(() =>
  import('./document-layout/CommentsDocumentLayout').then((module) => ({
    default: module.CommentsDocumentLayout,
  })),
)
const CommentsField = lazy(() =>
  import('./field/CommentsField').then((module) => ({default: module.CommentsField})),
)
const CommentsInput = lazy(() =>
  import('./input/CommentsInput').then((module) => ({default: module.CommentsInput})),
)
const CommentsStudioLayout = lazy(() =>
  import('./studio-layout/CommentsStudioLayout').then((module) => ({
    default: module.CommentsStudioLayout,
  })),
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
