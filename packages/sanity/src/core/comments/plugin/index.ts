import {lazy} from 'react'

import {definePlugin} from '../../config/definePlugin'
import {commentsUsEnglishLocaleBundle} from '../i18n'
import {commentsInspector} from './inspector'

const CommentsDocumentLayout = lazy(() => import('./document-layout/CommentsDocumentLayout.lazy'))
const CommentsField = lazy(() => import('./field/CommentsField.lazy'))
const CommentsInput = lazy(() => import('./input/CommentsInput.lazy'))
const CommentsStudioLayout = lazy(() => import('./studio-layout/CommentsStudioLayout.lazy'))

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
