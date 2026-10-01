import {useEffect} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {TasksFeaturesPromiseContext} from 'sanity/_singletons'

import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'

export function TasksStudioProvider(props: ProviderProps) {
  const features$ = useFeatureEnabledObservable(FEATURES.sanityTasks)
  const featuresPromise = useObservablePromise(features$)
  useEffect(() => {
    void preloadObservablePromise(features$)
  }, [features$])

  return (
    <TasksFeaturesPromiseContext value={featuresPromise}>
      {props.renderDefault(props)}
    </TasksFeaturesPromiseContext>
  )
}
