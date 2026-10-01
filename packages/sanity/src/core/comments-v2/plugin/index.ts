import {lazy} from 'react'

import {definePlugin} from '../../config/definePlugin'
import {commentsUsEnglishLocaleBundle} from '../i18n'
import {commentsInspector} from './inspector'
import {CommentsStudioLayout} from './studio-layout/CommentsStudioLayout'
import {CommentsStudioProvider} from './studio-provider/CommentsStudioProvider'

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
      provider: CommentsStudioProvider,
      layout: CommentsStudioLayout,
    },
  },

  i18n: {bundles: [commentsUsEnglishLocaleBundle]},
})
