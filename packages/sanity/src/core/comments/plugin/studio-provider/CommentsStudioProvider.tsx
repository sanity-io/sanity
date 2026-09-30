import {useEffect} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {CommentsFeaturesPromiseContext} from 'sanity/_singletons'

import {type ProviderProps} from '../../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../../hooks/useFeatureEnabled'

/**
 * Starts the comments feature check as soon as the studio's providers commit, above the loading
 * screen boundary, and hands the promise down: `CommentsStudioLayout` `use()`s it and suspends up
 * to that screen, so whether the upsell provider wraps the studio is decided once, before it
 * renders, and `useResolveCommentsEnabled` reads it settled when a document opens.
 */
export function CommentsStudioProvider(props: ProviderProps) {
  const features$ = useFeatureEnabledObservable(FEATURES.studioComments)
  const featuresPromise = useObservablePromise(features$)
  // Start the request on commit, in parallel with the other providers' checks, rather than on
  // the hook's own deferred first subscription.
  useEffect(() => {
    void preloadObservablePromise(features$)
  }, [features$])

  return (
    <CommentsFeaturesPromiseContext.Provider value={featuresPromise}>
      {props.renderDefault(props)}
    </CommentsFeaturesPromiseContext.Provider>
  )
}
