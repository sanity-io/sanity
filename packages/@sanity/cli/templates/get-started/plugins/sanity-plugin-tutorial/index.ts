import {definePlugin} from 'sanity'
import {CustomDefaultLayout} from './CustomDefaultLayout'

export const getStartedPlugin = definePlugin({
  name: 'sanity-plugin-tutorial',
  studio: {
    components: {
      layout: CustomDefaultLayout
    }
  },
})
