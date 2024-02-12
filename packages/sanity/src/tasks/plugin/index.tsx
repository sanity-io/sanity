import {TasksStudioActiveToolLayout} from './TasksStudioActiveToolLayout'
import {TasksDocumentInputLayout} from './TasksDocumentInputLayout'
import {TasksStudioLayout} from './TasksStudioLayout'
import {TasksStudioNavbar} from './TasksStudioNavbar'
import {ObjectInputProps, definePlugin} from 'sanity'

export const tasks = definePlugin({
  name: 'sanity/tasks',
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
