import {lazy, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {map} from 'rxjs'
import {CommentsModePromiseContext} from 'sanity/_singletons'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {type CommentsMode} from '../context/enabled/types'
import {commentsUsEnglishLocaleBundle} from '../i18n'
import {commentsInspector} from './inspector'
import {CommentsStudioLayout} from './studio-layout/CommentsStudioLayout'

const lazyCommentsField = () => import('./field/CommentsField')
const lazyCommentsInput = () => import('./input/CommentsInput')
// The field and input components render only inside a document form. The document layout renders
// around every document pane, ahead of its fields, so loading it starts their chunks too: nothing
// of the three is downloaded before a document is opened, and nothing waits for another.
const CommentsDocumentLayout = lazy(() => {
  void lazyCommentsField()
  void lazyCommentsInput()
  return import('./document-layout/CommentsDocumentLayout')
})
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
  // Derived inside the observable, so the context carries the promise that settles in place and
  // `use()` reads it synchronously once it has (a `.then()`-derived promise suspends once more)
  const mode$ = useMemo(
    () =>
      features$.pipe(
        map(({enabled, error}): CommentsMode => {
          if (error) return null
          return enabled ? 'default' : 'upsell'
        }),
      ),
    [features$],
  )
  const modePromise = useObservablePromise(mode$)
  useEffect(() => {
    void preloadObservablePromise(mode$)
  }, [mode$])

  return (
    <CommentsModePromiseContext value={modePromise}>
      {props.renderDefault(props)}
    </CommentsModePromiseContext>
  )
}
