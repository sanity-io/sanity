import {type Config} from 'sanity'

import {ListenerStallTool} from '../components/listenerStallTool'

/**
 * The listener stall session's heavy tab: a workspace whose only tool opens N listeners on demand.
 * Customization build only, so the pristine dist never carries it.
 */
export const listenerStallWorkspace = {
  name: 'listener-stall-bench',
  tools: [{name: 'listeners', title: 'Listeners', component: ListenerStallTool}],
  schema: {types: []},
} satisfies Partial<Config>
