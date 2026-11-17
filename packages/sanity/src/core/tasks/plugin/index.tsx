import {lazy, useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {map} from 'rxjs'
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
import {TasksStudioNavbar} from './TasksStudioNavbar'

const lazyTasksStudioActiveToolLayout = () => import('./TasksStudioActiveToolLayout')
const TasksStudioActiveToolLayout = lazy(lazyTasksStudioActiveToolLayout)

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
  // Derived inside the observable, so the context carries the promise that settles in place and
  // `use()` reads it synchronously once it has (a `.then()`-derived promise suspends once more)
  const mode$ = useMemo(
    () =>
      features$.pipe(
        map(({enabled, error}): TasksMode => {
          if (error) return null
          return enabled ? 'default' : 'upsell'
        }),
      ),
    [features$],
  )
  const modePromise = useObservablePromise(mode$)
  useEffect(() => {
    void preloadObservablePromise(mode$)
  }, [mode$])
  useEffect(() => {
    // Preload lazy components (fire-and-forget: the lazy() render reports a failed import)
    void lazyTasksStudioActiveToolLayout()
  }, [])

  return (
    <TasksModePromiseContext value={modePromise}>
      {props.renderDefault(props)}
    </TasksModePromiseContext>
  )
}
