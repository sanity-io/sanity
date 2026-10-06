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

const CommentsDocumentLayout = lazy(() => import('./document-layout/CommentsDocumentLayout'))
const CommentsField = lazy(() => import('./field/CommentsField'))
const CommentsInput = lazy(() => import('./input/CommentsInput'))

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
  // Mapped before the promise so the mode is carried by the `ObservablePromise` itself: a promise
  // derived with `.then()` has no `status`/`value` for `use()` to read, so the first consumer
  // would suspend even once the check has settled.
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
