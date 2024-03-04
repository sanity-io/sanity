import {definePlugin, type ObjectInputProps} from 'sanity'

import {DocumentBadge} from './TasksBadge'
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
    // eslint-disable-next-line camelcase
    __internal_tasks: {
      footerAction: <DocumentBadge />,
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
