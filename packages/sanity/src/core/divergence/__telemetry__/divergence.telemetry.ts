import {defineEvent} from '@sanity/telemetry'

interface InspectedDivergenceInfo {
  sessionId: string | null
  divergenceCount: number
}

export const InspectedDivergence = defineEvent<InspectedDivergenceInfo>({
  name: 'Inspected Divergence',
  version: 1,
  description: 'User inspected divergence in a single node',
})

interface ActedOnDivergenceInfo {
  action: 'take-upstream-value' | 'mark-resolved'
  sessionId: string | null
  divergenceCount: number
  status: 'success' | 'failure'
}

export const ActedOnDivergence = defineEvent<ActedOnDivergenceInfo>({
  name: 'Acted On Divergence',
  version: 1,
  description: 'User acted on divergence in a single node',
})
