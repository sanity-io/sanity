import {definePlugin} from '../config'
import {tasksPlugin} from '../tasks'

/**
 * Core plugins for Sanity Studio
 */
export const corePlugins = definePlugin({
  name: 'sanity/core/plugins',
  plugins: [tasksPlugin()],
})
