import {useEffect} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {CommentsFeaturesPromiseContext} from 'sanity/_singletons'

import {type ProviderProps} from '../../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../../hooks/useFeatureEnabled'

export function CommentsStudioProvider(props: ProviderProps) {
  const features$ = useFeatureEnabledObservable(FEATURES.studioComments)
  const featuresPromise = useObservablePromise(features$)
  useEffect(() => {
    void preloadObservablePromise(features$)
  }, [features$])

  return (
    <CommentsFeaturesPromiseContext value={featuresPromise}>
      {props.renderDefault(props)}
    </CommentsFeaturesPromiseContext>
  )
}
