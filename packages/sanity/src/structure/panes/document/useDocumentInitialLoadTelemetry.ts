import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, useRef} from 'react'
import {type EditStateFor} from 'sanity'

import {DocumentInitialLoadMeasured} from './__telemetry__/documentInitialLoad.telemetry'

interface UseDocumentInitialLoadTelemetryOptions {
  /** pane's `ready` flag — `true` when the form is ready to edit */
  ready: boolean
  /** resolved schema type (name is logged; may be undefined before schema resolves) */
  schemaTypeName: string | undefined
  /** current edit state (used to derive `isNewDocument`) */
  editState: Pick<EditStateFor, 'ready' | 'draft' | 'published' | 'version'> | null | undefined
  /** true when the pane is opened with a `rev` param (viewing history) */
  hasRevisionParam: boolean
}

/**
 * Fires a one-shot `Document Initial Load Measured` telemetry event the
 * first time the pane's `ready` flag becomes `true`. Captures the
 * user-perceived cold-open latency from pane mount to editable form.
 *
 * Extracted from `DocumentPaneProvider` to keep the provider lean and to
 * give the timing logic a focused test target.
 */
export function useDocumentInitialLoadTelemetry({
  ready,
  schemaTypeName,
  editState,
  hasRevisionParam,
}: UseDocumentInitialLoadTelemetryOptions): void {
  const telemetry = useTelemetry()

  // T0 captured synchronously on first render (~ pane mount / route change).
  const t0Ref = useRef<number | null>(null)
  if (t0Ref.current === null) {
    t0Ref.current = performance.now()
  }

  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    if (!ready) return
    firedRef.current = true
    const t0 = t0Ref.current ?? performance.now()
    const isNewDoc =
      editState?.ready === true &&
      editState.draft === null &&
      editState.published === null &&
      editState.version === null
    telemetry.log(DocumentInitialLoadMeasured, {
      durationMs: performance.now() - t0,
      documentTypeName: schemaTypeName ?? 'unknown',
      isNewDocument: isNewDoc,
      hasRevisionParam,
    })
  }, [ready, telemetry, schemaTypeName, editState, hasRevisionParam])
}
