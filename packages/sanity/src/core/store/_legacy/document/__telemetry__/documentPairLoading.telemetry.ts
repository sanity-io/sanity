import {defineEvent} from '@sanity/telemetry'

interface DocumentPairLoadingMeasuredData {
  durationMs: number
  hasPublished: boolean
  hasDraft: boolean
  hasVersion: boolean
}

export const DocumentPairLoadingMeasured = defineEvent<DocumentPairLoadingMeasuredData>({
  name: 'Document Pair Loading Measured',
  version: 1,
  description: 'Time from document pair subscription to first ready snapshot',
  maxSampleRate: 5_000,
})
