import {lazy, Suspense, useEffect} from 'react'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {type ObjectInputProps} from '../../form/types/inputProps'
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
  useEffect(() => {
    // Preload lazy components (fire-and-forget: the lazy() render reports a failed import)
    void lazyTasksStudioActiveToolLayout()
    void lazyTasksStudioNavbar()
  }, [])

  return props.renderDefault(props)
}
