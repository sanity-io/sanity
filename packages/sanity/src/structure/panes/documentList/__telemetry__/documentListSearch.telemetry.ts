import {defineEvent} from '@sanity/telemetry'

interface DocumentListLoadTimeData {
  /**
   * How long it took to load the document list end to end
   */
  durationMs: number
  /**
   * Length of the search string typed into the "Search"-field above the document list
   */
  searchStringLength: number
  /**
   * Represents the number of documents that was returned by the document list
   */
  returnedDocuments: number
  /**
   * Whether the document list was loaded from an in-memory cache or not
   */
  fromCache: boolean
}

export const DocumentListLoadTimeMeasured = defineEvent<DocumentListLoadTimeData>({
  name: 'Document List Load Time Measured',
  version: 1,
  description: 'Time from document list search subscription to first result',
  maxSampleRate: 10_000,
})
