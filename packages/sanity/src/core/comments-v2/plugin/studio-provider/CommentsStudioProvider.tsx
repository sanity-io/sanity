import {useEffect} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {CommentsFeaturesPromiseContextV2} from 'sanity/_singletons'

import {type ProviderProps} from '../../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../../hooks/useFeatureEnabled'

export function CommentsStudioProvider(props: ProviderProps) {
  const features$ = useFeatureEnabledObservable(FEATURES.studioComments)
  const featuresPromise = useObservablePromise(features$)
  useEffect(() => {
    void preloadObservablePromise(features$)
  }, [features$])

  return (
    <CommentsFeaturesPromiseContextV2 value={featuresPromise}>
      {props.renderDefault(props)}
    </CommentsFeaturesPromiseContextV2>
  )
}
