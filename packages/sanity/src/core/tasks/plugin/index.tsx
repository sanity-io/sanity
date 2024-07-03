import {definePlugin} from '../../config'
import {type ObjectInputProps} from '../../form'
import {tasksUsEnglishLocaleBundle} from '../i18n'
import {TaskCreateAction} from './TaskCreateAction'
import {TasksDocumentInputLayout} from './TasksDocumentInputLayout'
import {TasksFooterOpenTasks} from './TasksFooterOpenTasks'
import {TasksStudioActiveToolLayout} from './TasksStudioActiveToolLayout'
import {TasksStudioLayout} from './TasksStudioLayout'
import {TasksStudioNavbar} from './TasksStudioNavbar'

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
  // eslint-disable-next-line camelcase
  __internal_tasks: {
    footerAction: <TasksFooterOpenTasks />,
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
