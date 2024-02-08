import {definePlugin} from '../../config'
import {TasksStudioLayout} from './TasksStudioLayout'
import {TasksStudioNavbar} from './TasksStudioNavbar'

export const tasksPlugin = definePlugin({
  name: 'sanity/core/tasks',

  studio: {
    components: {
      layout: TasksStudioLayout,
      navbar: TasksStudioNavbar,
    },
  },
})
