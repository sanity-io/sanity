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
  // Mapped on the observable rather than with `.then()`: a derived promise is a plain promise,
  // and `use()` only reads a settled value without suspending from the promise the hook returns
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
