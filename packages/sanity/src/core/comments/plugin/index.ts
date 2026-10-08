import {lazy, useEffect} from 'react'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {commentsUsEnglishLocaleBundle} from '../i18n'
import {commentsInspector} from './inspector'
import {CommentsStudioLayout} from './studio-layout/CommentsStudioLayout'

const lazyCommentsDocumentLayout = () => import('./document-layout/CommentsDocumentLayout')
const lazyCommentsField = () => import('./field/CommentsField')
const lazyCommentsInput = () => import('./input/CommentsInput')
const CommentsDocumentLayout = lazy(lazyCommentsDocumentLayout)
const CommentsField = lazy(lazyCommentsField)
const CommentsInput = lazy(lazyCommentsInput)

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

function CommentsStudioProvider(props: ProviderProps) {
  useEffect(() => {
    // Preload lazy components (fire-and-forget: the lazy() render reports a failed import)
    void lazyCommentsDocumentLayout()
    void lazyCommentsField()
    void lazyCommentsInput()
  }, [])

  return props.renderDefault(props)
}
