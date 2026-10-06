import {lazy, Suspense, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {map} from 'rxjs'
import {TasksEnabledContext, TasksModePromiseContext} from 'sanity/_singletons'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {type ObjectInputProps} from '../../form/types/inputProps'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../studio/workspace'
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

function TasksStudioProvider(props: ProviderProps) {
  const isWorkspaceEnabled = useWorkspace().tasks?.enabled !== false
  const features$ = useFeatureEnabledObservable(FEATURES.sanityTasks)
  // Mapped as an observable, not with `featuresPromise.then()`: that returns a plain promise
  // without the settled `status` that lets `use()` read it without suspending the sidebar
  const mode$ = useMemo(
    () =>
      features$.pipe(
        map(({enabled, error}): TasksMode => {
          if (error || !isWorkspaceEnabled) return null
          return enabled ? 'default' : 'upsell'
        }),
      ),
    [features$, isWorkspaceEnabled],
  )
  const modePromise = useObservablePromise(mode$)
  useEffect(() => {
    void preloadObservablePromise(mode$)
  }, [mode$])
  useEffect(() => {
    // Preload lazy components
    void lazyTasksStudioActiveToolLayout()
    void lazyTasksStudioNavbar()
  }, [])

  return (
    <TasksEnabledContext value={isWorkspaceEnabled}>
      <TasksModePromiseContext value={modePromise}>
        {props.renderDefault(props)}
      </TasksModePromiseContext>
    </TasksEnabledContext>
  )
}
