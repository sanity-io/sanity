import {defineEvent} from '@sanity/telemetry'

export interface PerformanceINPMeasuredData {
  target: string | null
  duration: number
  interaction: string
}

export const PerformanceINPMeasured = defineEvent<PerformanceINPMeasuredData>({
  name: 'Performance INP Measured',
  //@ts-expect-error not yet supported, see https://github.com/sanity-io/telemetry/pull/6
  // Do not sample more often than every 10s
  maxSampleRate: 10_000,
  version: 1,
  description: 'Performance INP (Interaction to Next Paint) measurement happened',
})
