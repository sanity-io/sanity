import {lazy, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {CommentsModePromiseContext} from 'sanity/_singletons'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {type CommentsMode} from '../context/enabled/types'
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
  const features$ = useFeatureEnabledObservable(FEATURES.studioComments)
  const featuresPromise = useObservablePromise(features$)
  useEffect(() => {
    void preloadObservablePromise(features$)
  }, [features$])
  useEffect(() => {
    // Preload lazy components (fire-and-forget: the lazy() render reports a failed import)
    void lazyCommentsDocumentLayout()
    void lazyCommentsField()
    void lazyCommentsInput()
  }, [])

  const modePromise = useMemo(
    () =>
      featuresPromise.then(({enabled, error}): CommentsMode => {
        if (error) return null
        return enabled ? 'default' : 'upsell'
      }),
    [featuresPromise],
  )

  return (
    <CommentsModePromiseContext value={modePromise}>
      {props.renderDefault(props)}
    </CommentsModePromiseContext>
  )
}
