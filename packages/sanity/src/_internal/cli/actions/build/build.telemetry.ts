import {defineTrace} from '@sanity/telemetry'

export const BuildTrace = defineTrace<{outputSize: number}>({
  name: 'Studio Build Completed',
  version: 0,
  description: 'A Studio build completed',
})
