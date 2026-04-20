import {defineEvent} from '@sanity/telemetry'

/**
 * Time from a document pane mounting to its form becoming ready to edit.
 *
 * This measures the **user-perceived cold-open latency**: from when the
 * pane component first renders (approximately equal to the route change
 * that opened the document) to the moment the form is interactive. This
 * is a strict superset of `Document Pair Load Time Measured`, which
 * measures only the data-layer portion (pair subscription → first
 * snapshot).
 *
 * Additional latency captured by this event but *not* by
 * `Document Pair Load Time Measured`:
 * - form state setup (`useDocumentForm`)
 * - template permissions resolution
 * - timeline readiness (when viewing a revision via `params.rev`)
 * - route → pane mount overhead
 *
 * Timing origin (T0) is the first render of `DocumentPaneProvider`
 * (captured synchronously via a lazily-initialised ref). Timing end
 * (T1) is the first tick where the provider's `ready` flag becomes
 * `true`, as exposed on `DocumentPaneContext`.
 *
 * Sampled at 30 seconds to match `Document Pair Load Time Measured`.
 */
export interface DocumentInitialLoadMeasuredData {
  /** ms from pane mount → ready=true */
  durationMs: number
  /** resolved document type name (may be 'unknown' if schema was not resolved) */
  documentTypeName: string
  /** true when the pane is editing a brand-new, never-written document */
  isNewDocument: boolean
  /** true when the pane was opened with a `rev` route param (viewing history) */
  hasRevisionParam: boolean
}

export const DocumentInitialLoadMeasured = defineEvent<DocumentInitialLoadMeasuredData>({
  name: 'Document Initial Load Measured',
  version: 1,
  description:
    'Time from a document pane mounting to its form becoming ready to edit. ' +
    'Includes data load, schema resolution, template permissions, and ' +
    '(if applicable) timeline readiness. Superset of Document Pair Load ' +
    'Time Measured.',
  maxSampleRate: 30_000,
})
