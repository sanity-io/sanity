import {definePlugin, type ObjectInputProps} from 'sanity'

import {TasksDocumentInputLayout} from './TasksDocumentInputLayout'
import {TasksFooterOpenTasks} from './TasksFooterOpenTasks'
import {TasksStudioActiveToolLayout} from './TasksStudioActiveToolLayout'
import {TasksStudioLayout} from './TasksStudioLayout'
import {TasksStudioNavbar} from './TasksStudioNavbar'

interface TasksPluginOptions {
  withAddonDatasetProvider?: boolean
}

/**
 * @internal
 * @beta
 */
export const tasks = definePlugin<TasksPluginOptions | void>((opts) => {
  const {withAddonDatasetProvider = true} = opts || {}

  return {
    name: 'sanity/tasks',
    // eslint-disable-next-line camelcase
    __internal_tasks: {
      footerAction: <TasksFooterOpenTasks />,
    },
    studio: {
      components: {
        layout: (props) => (
          <TasksStudioLayout {...props} withAddonDatasetProvider={withAddonDatasetProvider} />
        ),
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
  }
})
