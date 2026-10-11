import {type Config} from 'sanity'

import {EmptyTool} from '../components/emptyTool'

/**
 * A workspace with one empty tool and no schema types or plugins (no
 * structure tool): the baseline the load scenarios compare tool cost against.
 */
export const emptyToolWorkspace = {
  name: 'empty-tool-bench',
  tools: [{name: 'empty', title: 'Empty', component: EmptyTool}],
  schema: {types: []},
} satisfies Partial<Config>
