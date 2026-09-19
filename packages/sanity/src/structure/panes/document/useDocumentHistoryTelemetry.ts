import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useRef} from 'react'

import {
  DocumentHistoryInspectorOpened,
  DocumentHistoryInspectorTabChanged,
  type DocumentHistoryOpenPath,
} from './__telemetry__/documentPanes.telemetry'
import {type ChangesInspectorTab} from './constants'

interface UseDocumentHistoryTelemetryOptions {
  /** true while the history / review changes inspector is the open inspector */
  changesOpen: boolean
  /** tab resolved from the pane router params */
  activeTab: ChangesInspectorTab
}

interface DocumentHistoryTelemetry {
  /**
   * Attributes the open the caller is about to perform. An open with no recorded intent is reported
   * as `url`, covering deep links, reloads and history navigation.
   */
  recordOpenIntent: (path: DocumentHistoryOpenPath) => void
  /**
   * Records the tab an in-flight open writes. Pane router params round-trip a macrotask later, so
   * the open transition would otherwise read the tab that was showing beforehand.
   */
  recordOpenTab: (tab: ChangesInspectorTab) => void
}

/**
 * Fires `Document History Inspector Opened` when the history / review changes inspector transitions
 * open, and `Document History Inspector Tab Changed` on every subsequent tab switch. Watching the
 * transition rather than the controls catches entry points that bypass them, deep links included.
 *
 * Extracted from `useDocumentPaneInspector` to keep the inspector state separate from the reporting
 * and to give the transition logic a focused test target.
 */
export function useDocumentHistoryTelemetry({
  changesOpen,
  activeTab,
}: UseDocumentHistoryTelemetryOptions): DocumentHistoryTelemetry {
  const telemetry = useTelemetry()

  const openIntentRef = useRef<{path: DocumentHistoryOpenPath; tab?: ChangesInspectorTab} | null>(
    null,
  )
  // The tab last reported to telemetry; null while the inspector is closed.
  const reportedTabRef = useRef<ChangesInspectorTab | null>(null)

  // An intent recorded while the inspector is already open has no transition to be consumed by, so
  // skipping it keeps a stale path from outliving the interaction that set it.
  const recordOpenIntent = useCallback(
    (path: DocumentHistoryOpenPath) => {
      if (changesOpen) {
        return
      }

      openIntentRef.current = {path}
    },
    [changesOpen],
  )

  const recordOpenTab = useCallback((tab: ChangesInspectorTab) => {
    if (openIntentRef.current) {
      openIntentRef.current.tab = tab
    }
  }, [])

  useEffect(() => {
    const intent = openIntentRef.current
    const reportedTab = reportedTabRef.current

    openIntentRef.current = null

    if (changesOpen) {
      if (reportedTab === null) {
        // Seeded from the intent so the tab param landing a tick later is not read as a tab change.
        const openedTab = intent?.tab ?? activeTab

        reportedTabRef.current = openedTab
        telemetry.log(DocumentHistoryInspectorOpened, {
          tab: openedTab,
          path: intent?.path ?? 'url',
        })
        return
      }

      reportedTabRef.current = activeTab

      if (reportedTab !== activeTab) {
        telemetry.log(DocumentHistoryInspectorTabChanged, {
          tab: activeTab,
          previousTab: reportedTab,
        })
      }
      return
    }

    reportedTabRef.current = null
  }, [activeTab, changesOpen, telemetry])

  return {recordOpenIntent, recordOpenTab}
}
