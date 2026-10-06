import {lazy, Suspense, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {TasksModePromiseContext} from 'sanity/_singletons'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {type ObjectInputProps} from '../../form/types/inputProps'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {type TasksMode} from '../context/enabled/types'
import {tasksUsEnglishLocaleBundle} from '../i18n'
import {TaskCreateAction} from './TaskCreateAction'
import {TasksDocumentInputLayout} from './TasksDocumentInputLayout'
import {TasksStudioLayout} from './TasksStudioLayout'

const TasksFooterOpenTasks = lazy(() => import('./TasksFooterOpenTasks'))

const lazyTasksStudioActiveToolLayout = () => import('./TasksStudioActiveToolLayout')
const lazyTasksStudioNavbar = () => import('./TasksStudioNavbar')
const TasksStudioActiveToolLayout = lazy(lazyTasksStudioActiveToolLayout)
const TasksStudioNavbar = lazy(lazyTasksStudioNavbar)

/**
 * @internal
 */
export const TASKS_NAME = 'sanity/tasks'

/**
 * @internal
 * @beta
 */
export const tasks = definePlugin({
  name: TASKS_NAME,
  __internal_tasks: {
    // The footer action is consumed as a `ReactNode` outside any Suspense boundary
    // (see DocumentStatusBarActions), so the lazy component needs its own boundary here.
    footerAction: (
      <Suspense>
        <TasksFooterOpenTasks />
      </Suspense>
    ),
  },
  document: {
    actions: (prev) => {
      return [...prev, TaskCreateAction].filter(Boolean)
    },
  },
  studio: {
    components: {
      provider: TasksStudioProvider,
      layout: TasksStudioLayout,
      navbar: TasksStudioNavbar,
      activeToolLayout: TasksStudioActiveToolLayout,
    },
  },
  form: {
    components: {
      input: (props) => {
        'use memo'
        if (props.id === 'root' && props.schemaType.type?.name === 'document') {
          return <TasksDocumentInputLayout {...(props as ObjectInputProps)} />
        }

        return props.renderDefault(props)
      },
    },
  },
  i18n: {
    bundles: [tasksUsEnglishLocaleBundle],
  },
})

// `getDefaultPlugins` only includes this plugin when the workspace has tasks enabled, so none of
// its components check `workspace.tasks.enabled` themselves.
function TasksStudioProvider(props: ProviderProps) {
  const features$ = useFeatureEnabledObservable(FEATURES.sanityTasks)
  const featuresPromise = useObservablePromise(features$)
  useEffect(() => {
    void preloadObservablePromise(features$)
  }, [features$])
  useEffect(() => {
    // Preload lazy components
    void lazyTasksStudioActiveToolLayout()
    void lazyTasksStudioNavbar()
  }, [])

  const modePromise = useMemo(
    () =>
      featuresPromise.then(({enabled, error}): TasksMode => {
        // A failed check must not unlock the paid experience
        if (error) return 'upsell'
        return enabled ? 'default' : 'upsell'
      }),
    [featuresPromise],
  )

  return (
    <TasksModePromiseContext value={modePromise}>
      {props.renderDefault(props)}
    </TasksModePromiseContext>
  )
}
