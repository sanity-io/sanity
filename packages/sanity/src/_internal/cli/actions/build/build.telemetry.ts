import {defineTrace} from '@sanity/telemetry'

export const BuildTrace = defineTrace<{outputSize: number}>({
  name: 'Build Studio',
  version: 0,
  description: 'Studio is being built',
})
