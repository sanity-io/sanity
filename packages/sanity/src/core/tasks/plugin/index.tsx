import {lazy, Suspense} from 'react'

import {definePlugin} from '../../config/definePlugin'
import {type ObjectInputProps} from '../../form/types/inputProps'
import {tasksUsEnglishLocaleBundle} from '../i18n'
import {TaskCreateAction} from './TaskCreateAction'

const TasksDocumentInputLayout = lazy(() => import('./TasksDocumentInputLayout.lazy'))
const TasksFooterOpenTasks = lazy(() => import('./TasksFooterOpenTasks.lazy'))
const TasksStudioActiveToolLayout = lazy(() => import('./TasksStudioActiveToolLayout.lazy'))
const TasksStudioLayout = lazy(() => import('./TasksStudioLayout.lazy'))
const TasksStudioNavbar = lazy(() => import('./TasksStudioNavbar.lazy'))

// The footer action is consumed as a `ReactNode` outside any Suspense boundary
// (see DocumentStatusBarActions), so the lazy component needs its own boundary here.
function TasksFooterAction() {
  return (
    <Suspense fallback={null}>
      <TasksFooterOpenTasks />
    </Suspense>
  )
}

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
    footerAction: <TasksFooterAction />,
  },
  document: {
    actions: (prev) => {
      return [...prev, TaskCreateAction].filter(Boolean)
    },
  },
  studio: {
    components: {
      layout: TasksStudioLayout,
      navbar: TasksStudioNavbar,
      activeToolLayout: TasksStudioActiveToolLayout,
    },
  },
  form: {
    components: {
      input: (props) => {
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
