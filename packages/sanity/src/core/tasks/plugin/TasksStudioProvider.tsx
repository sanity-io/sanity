import {useEffect} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {TasksFeaturesPromiseContext} from 'sanity/_singletons'

import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'

/**
 * Starts the tasks feature check as soon as the studio's providers commit, above the loading
 * screen boundary, and hands the promise to `TasksEnabledProvider` in the layout below. The
 * layout `use()`s it and suspends up to that screen, so it renders once, in its final shape.
 */
export function TasksStudioProvider(props: ProviderProps) {
  const features$ = useFeatureEnabledObservable(FEATURES.sanityTasks)
  const featuresPromise = useObservablePromise(features$)
  // Start the request on commit, in parallel with the other providers' checks, rather than on
  // the hook's own deferred first subscription.
  useEffect(() => {
    void preloadObservablePromise(features$)
  }, [features$])

  return (
    <TasksFeaturesPromiseContext.Provider value={featuresPromise}>
      {props.renderDefault(props)}
    </TasksFeaturesPromiseContext.Provider>
  )
}
