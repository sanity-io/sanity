import {defineEvent} from '@sanity/telemetry'

export const InspectedDivergence = defineEvent({
  name: 'Inspected Divergence',
  version: 1,
  description: 'User inspected divergence in a single node',
})

export const ActedOnDivergence = defineEvent<{
  action: 'take-upstream-value' | 'mark-resolved'
}>({
  name: 'Inspected Divergence',
  version: 1,
  description: 'User acted on divergence in a single node',
})
