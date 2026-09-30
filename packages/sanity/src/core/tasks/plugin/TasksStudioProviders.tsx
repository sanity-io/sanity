import {TasksFeaturesPromiseContext} from 'sanity/_singletons'

import {type ProvidersProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledPromise} from '../../hooks/useFeatureEnabled'

/**
 * Starts the tasks feature check as soon as the studio's providers commit, above the loading
 * screen boundary, and hands the promise to `TasksEnabledProvider` in the layout below. The
 * layout `use()`s it and suspends up to that screen, so it renders once, in its final shape.
 */
export function TasksStudioProviders(props: ProvidersProps) {
  const featuresPromise = useFeatureEnabledPromise(FEATURES.sanityTasks)

  return (
    <TasksFeaturesPromiseContext.Provider value={featuresPromise}>
      {props.renderDefault(props)}
    </TasksFeaturesPromiseContext.Provider>
  )
}
