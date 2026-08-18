import {defineEvent} from '@sanity/telemetry'

interface DocumentPairLoadingMeasuredData {
  /**
   * How long it took to load the document pair
   */
  durationMs: number

  /**
   * Whether the document pair was loaded from an in-memory cache
   */
  fromCache: boolean

  /**
   * Did we load the published document?
   */
  hasPublished: boolean

  /**
   * Did we load the draft document?
   */
  hasDraft: boolean

  /**
   * Did we load a version document?
   */
  hasVersion: boolean
}

export const DocumentPairLoadingMeasured = defineEvent<DocumentPairLoadingMeasuredData>({
  name: 'Document Pair Load Time Measured',
  version: 1,
  description: 'Time from document pair subscription to first ready snapshot',
  maxSampleRate: 30_000,
})
