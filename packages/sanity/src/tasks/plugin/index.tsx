import {definePlugin, type ObjectInputProps} from 'sanity'

import {TaskCreateAction} from './TaskCreateAction'
import {TasksBadge} from './TasksBadge'
import {TasksDocumentInputLayout} from './TasksDocumentInputLayout'
import {TasksStudioActiveToolLayout} from './TasksStudioActiveToolLayout'
import {TasksStudioLayout} from './TasksStudioLayout'
import {TasksStudioNavbar} from './TasksStudioNavbar'

/**
 * @internal
 * @beta
 */
export const tasks = definePlugin({
  name: 'sanity/tasks',
  document: {
    badges: (prev) => {
      return [...prev, TasksBadge].filter(Boolean)
    },
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
})
