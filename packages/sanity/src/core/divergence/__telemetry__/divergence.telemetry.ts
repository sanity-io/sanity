import {defineEvent} from '@sanity/telemetry'

export interface InspectedDivergenceInfo {
  sessionId: string | null
  divergenceCount: number | null
}

export const InspectedDivergence = defineEvent<InspectedDivergenceInfo>({
  name: 'Inspected Divergence',
  version: 1,
  description: 'User viewed a divergence in a single node',
})

export interface ActedOnDivergenceInfo {
  action: 'take-upstream-value' | 'mark-resolved'
  sessionId: string | null
  divergenceCount: number | null
}

export const ActedOnDivergence = defineEvent<ActedOnDivergenceInfo>({
  name: 'Acted On Divergence',
  version: 1,
  description: 'User resolved a divergence in a single node',
})
