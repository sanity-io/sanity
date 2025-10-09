import {definePlugin} from '../../config'
import {workflowsInspector} from './inspector'

export const workflows = definePlugin({
  name: 'sanity/workflows',
  document: {
    inspectors: [workflowsInspector],
  },
})
