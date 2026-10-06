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
  // Mapped in the observable, not with `promise.then`: a derived promise is a plain promise that
  // stays pending for a microtask, so `use()` could not read an already settled check without
  // suspending first.
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
