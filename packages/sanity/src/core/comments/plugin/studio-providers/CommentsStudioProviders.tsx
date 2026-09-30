import {CommentsFeaturesPromiseContext} from 'sanity/_singletons'

import {type ProvidersProps} from '../../../config/studio/types'
import {FEATURES, useFeatureEnabledPromise} from '../../../hooks/useFeatureEnabled'

/**
 * Starts the comments feature check as soon as the studio's providers commit, above the loading
 * screen boundary, and hands the promise to `CommentsStudioLayout` below. The layout `use()`s it
 * and suspends up to that screen, so whether the upsell provider wraps the studio is decided once,
 * before it renders.
 */
export function CommentsStudioProviders(props: ProvidersProps) {
  const featuresPromise = useFeatureEnabledPromise(FEATURES.studioComments)

  return (
    <CommentsFeaturesPromiseContext.Provider value={featuresPromise}>
      {props.renderDefault(props)}
    </CommentsFeaturesPromiseContext.Provider>
  )
}
