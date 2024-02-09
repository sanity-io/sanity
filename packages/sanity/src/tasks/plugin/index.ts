import {TasksStudioActiveToolLayout} from './TasksStudioActiveToolLayout'
import {TasksStudioLayout} from './TasksStudioLayout'
import {TasksStudioNavbar} from './TasksStudioNavbar'
import {definePlugin} from 'sanity'

export const tasks = definePlugin({
  name: 'sanity/tasks',
  studio: {
    components: {
      layout: TasksStudioLayout,
      navbar: TasksStudioNavbar,
      activeToolLayout: TasksStudioActiveToolLayout,
    },
  },
  //   form: {
  //     components: {
  //       field: <TasksSetDocumentId>,
  //     },
  //   },
})
