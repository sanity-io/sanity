import {defineEvent} from '@sanity/telemetry'

export interface PerformanceINPMeasuredData {
  target: string | null
  attrs?: {
    ui?: string
    testId?: string
  }
  duration: number
  interaction: string
}

export const PerformanceINPMeasured = defineEvent<PerformanceINPMeasuredData>({
  name: 'Performance INP Measured',
  // Sample at most every minute
  maxSampleRate: 60_000,
  version: 1,
  description: 'Performance INP (Interaction to Next Paint) measurement happened',
})
