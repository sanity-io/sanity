import {Suspense} from 'react'

import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {type LayoutProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledPromise} from '../../hooks/useFeatureEnabled'
import {AddonDatasetProvider} from '../../studio/addonDataset/AddonDatasetProvider'
import {TasksEnabledProvider} from '../context/enabled/TasksEnabledProvider'
import {useTasksEnabled} from '../context/enabled/useTasksEnabled'
import {TasksNavigationProvider} from '../context/navigation/TasksNavigationProvider'
import {TasksProvider} from '../context/tasks/TasksProvider'
import {TasksUpsellProvider} from '../context/upsell/TasksUpsellProvider'

const TasksStudioLayoutInner = (props: LayoutProps) => {
  const {enabled, mode} = useTasksEnabled()

  if (!enabled) {
    return props.renderDefault(props)
  }

  const children = (
    <TasksProvider>
      <TasksNavigationProvider>{props.renderDefault(props)}</TasksNavigationProvider>
    </TasksProvider>
  )

  if (mode === 'upsell') {
    return (
      <AddonDatasetProvider>
        <TasksUpsellProvider>{children}</TasksUpsellProvider>
      </AddonDatasetProvider>
    )
  }

  return <AddonDatasetProvider>{children}</AddonDatasetProvider>
}

export function TasksStudioLayout(props: LayoutProps) {
  const featureEnabledPromise = useFeatureEnabledPromise(FEATURES.sanityTasks)

  // The provider suspends on the feature check so the layout renders once, in its final shape.
  // The boundary sits here, between the hook and the `use()`, so this component commits and the
  // request starts; its fallback is the same loading screen `StudioLayout` shows for the lazy
  // layout chunk, so the loading state simply lasts until the answer is in.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <TasksEnabledProvider featureEnabledPromise={featureEnabledPromise}>
        <TasksStudioLayoutInner {...props} />
      </TasksEnabledProvider>
    </Suspense>
  )
}
