import {defineTrace} from '@sanity/telemetry'

export const BuildTrace = defineTrace<{outputSize: number}>({
  name: 'App Build Completed',
  version: 0,
  description: 'An App build completed',
})
