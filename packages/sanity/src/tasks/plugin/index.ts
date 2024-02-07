import {definePlugin} from '../../core'
import {TasksStudioActiveToolLayout} from './studio-activeToolLayout'
import {TasksStudioLayout} from './studio-layout'
import {TasksStudioNavbar} from './studio-navbar'

export const tasks = definePlugin({
  name: 'sanity/structure/tasks',

  //   document: {
  //     inspectors: [],
  //     // components: {
  //     //   unstable_layout: CommentsDocumentLayout,
  //     // },
  //   },

  //   form: {
  //     components: {
  //       field: CommentsField,
  //     },
  //   },

  studio: {
    components: {
      layout: TasksStudioLayout,
      navbar: TasksStudioNavbar,
      activeToolLayout: TasksStudioActiveToolLayout,
    },
  },

  //   i18n: {bundles: [commentsUsEnglishLocaleBundle]},
})
