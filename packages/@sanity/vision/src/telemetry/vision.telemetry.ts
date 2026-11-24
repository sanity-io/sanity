import {defineEvent} from '@sanity/telemetry'

import {type VisionExportSnippetId} from '../redesign/store/types'

/**
 * Temporary adoption events. They compare the same operations in classic and redesigned
 * Vision for a few months, then get removed. Payloads never include query text, parameter
 * values or names, dataset names, perspective names, or anything else that identifies a customer.
 */

export type VisionQueryMode = 'fetch' | 'listen'
export type VisionQueryTrigger = 'button' | 'shortcut'

export interface VisionQueryRunData {
  mode: VisionQueryMode
  trigger: VisionQueryTrigger
  /** True when the run sent at least one parameter. Values and names are not recorded. */
  hasParams: boolean
}

/** User ran the current query. A dataset, perspective, or API version change does not count. */
export const VisionQueryRun = defineEvent<VisionQueryRunData>({
  name: 'Vision Query Run',
  version: 1,
  description:
    'User ran a GROQ query in Vision, with Fetch or Listen. Temporary adoption event. ' +
    'hasParams records whether the run included parameters; the query and the parameters are not recorded.',
})

/** The run included parameters. Fires with Vision Query Run, and only then. */
export const VisionParamsUsed = defineEvent<{mode: VisionQueryMode}>({
  name: 'Vision Params Used',
  version: 1,
  description:
    'User ran a Vision query that included parameters. Temporary adoption event. ' +
    'Parameter names and values are not recorded.',
})

export const VisionDatasetChanged = defineEvent({
  name: 'Vision Dataset Changed',
  version: 1,
  description:
    'User changed the dataset a Vision query runs against. Temporary adoption event. ' +
    'The dataset name is not recorded.',
})

export const VisionPerspectiveChanged = defineEvent({
  name: 'Vision Perspective Changed',
  version: 1,
  description:
    'User changed the perspective a Vision query runs against. Temporary adoption event. ' +
    'The perspective is not recorded.',
})

export const VisionApiVersionChanged = defineEvent<{custom: boolean}>({
  name: 'Vision API Version Changed',
  version: 1,
  description:
    'User changed the API version a Vision query runs against. Temporary adoption event. ' +
    'custom is true when they typed a version rather than picking a listed one. The version is not recorded.',
})

export const VisionCopied = defineEvent<{target: 'query' | 'params' | 'url'}>({
  name: 'Vision Copied',
  version: 1,
  description:
    'User copied the Vision query, its params or its request URL. Temporary adoption event. ' +
    'The copied text is not recorded.',
})

export const VisionAgentActionInvoked = defineEvent<{
  action:
    | 'generate-query'
    | 'edit-query'
    | 'fix-lint'
    | 'generate-mutations'
    | 'explain'
    | 'improve-query'
    | 'fit-document-list'
}>({
  name: 'Vision Agent Action Invoked',
  version: 1,
  description:
    'User started a Vision agent action. Temporary adoption event. ' +
    'The prompt and the generated text are not recorded.',
})

export const VisionTabsChanged = defineEvent<{count: number; action: 'open' | 'add' | 'close'}>({
  name: 'Vision Tabs Changed',
  version: 1,
  description:
    'How many query tabs Vision has open. Temporary adoption event. ' +
    'open is the count when the tool mounts; add and close are later changes. Tab titles are not recorded.',
})

export const VisionQueryPrettified = defineEvent<{outcome: 'success' | 'error'}>({
  name: 'Vision Query Prettified',
  version: 1,
  description:
    'User prettified the Vision query. Temporary adoption event. ' +
    'outcome is error when the query does not parse. The query is not recorded.',
})

export const VisionLintUsed = defineEvent<{action: 'open' | 'fix'}>({
  name: 'Vision Lint Used',
  version: 1,
  description:
    'User opened Vision lint or applied one of its suggestions. Temporary adoption event. ' +
    'The finding and the query are not recorded.',
})

export const VisionSnippetCopied = defineEvent<{snippet: VisionExportSnippetId}>({
  name: 'Vision Snippet Copied',
  version: 1,
  description:
    'User copied an exported Vision query snippet. Temporary adoption event. ' +
    'The snippet source is not recorded.',
})
