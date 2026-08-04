import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type DocumentInspector, useSource} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {type PaneRouterContextValue} from '../../components/paneRouter/types'
import {type PaneMenuItem} from '../../types'
import {useStructureTool} from '../../useStructureTool'
import {
  DocumentHistoryInspectorOpened,
  DocumentHistoryInspectorTabChanged,
  type DocumentHistoryOpenPath,
} from './__telemetry__/documentPanes.telemetry'
import {
  type ChangesInspectorTab,
  HISTORY_INSPECTOR_NAME,
  INSPECT_ACTION_PREFIX,
  resolveChangesInspectorTab,
} from './constants'

export function useDocumentPaneInspector({
  documentId,
  documentType,
  params,
  setParams,
}: {
  params: NonNullable<PaneRouterContextValue['params']>
  documentId: string
  documentType: string
  setParams: (params: Record<string, string | undefined>) => void
}) {
  const {features} = useStructureTool()
  const telemetry = useTelemetry()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const source = useSource()
  const inspectorsResolver = source.document.inspectors

  const inspectors: DocumentInspector[] = useMemo(
    () => inspectorsResolver({documentId, documentType}),
    [documentId, documentType, inspectorsResolver],
  )

  const [inspectorName, setInspectorName] = useState<string | null>(() => params.inspect || null)

  // Handle inspector name changes from URL
  const inspectParamRef = useRef<string | undefined>(params.inspect)
  useEffect(() => {
    if (inspectParamRef.current !== params.inspect) {
      inspectParamRef.current = params.inspect
      setInspectorName(params.inspect || null)
    }
  }, [params.inspect])

  const currentInspector = useMemo(
    () => inspectors?.find((i) => i.name === inspectorName),
    [inspectors, inspectorName],
  )
  const historyInspector = useMemo(
    () => inspectors.find((i) => i.name === HISTORY_INSPECTOR_NAME),
    [inspectors],
  )

  const changesOpen = currentInspector?.name === HISTORY_INSPECTOR_NAME
  const activeTab = resolveChangesInspectorTab(params.changesInspectorTab)

  // Open handlers stash attribution here before flipping the inspector; the effect below reads it on
  // the open transition, then clears it. An empty ref means no handler ran (the URL / deep-link case).
  const openIntentRef = useRef<{path: DocumentHistoryOpenPath; tab?: ChangesInspectorTab} | null>(
    null,
  )
  const wasChangesOpenRef = useRef(false)
  const previousTabRef = useRef(activeTab)

  const logHistoryInspectorOpened = useEffectEvent(() => {
    const intent = openIntentRef.current
    const openedTab = intent?.tab ?? activeTab

    telemetry.log(DocumentHistoryInspectorOpened, {
      tab: openedTab,
      path: intent?.path ?? 'url',
    })

    // Seeded from the intent so the tab param landing a tick later is not read as a tab change.
    previousTabRef.current = openedTab
  })

  const logHistoryInspectorTabChanged = useEffectEvent(() => {
    telemetry.log(DocumentHistoryInspectorTabChanged, {
      tab: activeTab,
      previousTab: previousTabRef.current,
    })
  })

  useEffect(() => {
    const justOpened = changesOpen && !wasChangesOpenRef.current

    if (justOpened) {
      logHistoryInspectorOpened()
    } else {
      if (changesOpen && previousTabRef.current !== activeTab) {
        logHistoryInspectorTabChanged()
      }

      previousTabRef.current = activeTab
    }

    openIntentRef.current = null
    wasChangesOpenRef.current = changesOpen
  }, [activeTab, changesOpen])

  const closeInspector = useCallback(
    (closeInspectorName?: string) => {
      const inspector = closeInspectorName && inspectors.find((i) => i.name === closeInspectorName)

      if (closeInspectorName && !inspector) {
        console.warn(`No inspector named "${closeInspectorName}"`)
        return
      }

      if (!currentInspector) {
        return
      }

      if (inspector) {
        const result = inspector.onClose?.({params}) ?? {params}

        setInspectorName(null)
        inspectParamRef.current = undefined

        setParams({...result.params, inspect: undefined})

        return
      }

      if (currentInspector) {
        const result = currentInspector.onClose?.({params}) ?? {params}

        setInspectorName(null)
        inspectParamRef.current = undefined

        setParams({...result.params, inspect: undefined})
      }
    },
    [currentInspector, inspectors, params, setParams],
  )

  const openInspector = useCallback(
    (nextInspectorName: string, paneParams?: Record<string, string>) => {
      const nextInspector = inspectors.find((i) => i.name === nextInspectorName)

      if (!nextInspector) {
        console.warn(`No inspector named "${nextInspectorName}"`)
        return
      }

      // if the inspector is already open, only update params
      if (currentInspector?.name === nextInspector.name) {
        setParams({...params, ...paneParams, inspect: nextInspector.name})
        return
      }

      let currentParams = params

      if (currentInspector) {
        const closeResult = nextInspector.onClose?.({params: currentParams}) ?? {
          params: currentParams,
        }

        currentParams = closeResult.params
      }

      const result = nextInspector.onOpen?.({params: currentParams}) ?? {params: currentParams}

      setInspectorName(nextInspector.name)
      inspectParamRef.current = nextInspector.name

      const nextParams: Record<string, string | undefined> = {
        ...result.params,
        ...paneParams,
        inspect: nextInspector.name,
      }

      // Pane-router params round-trip a macrotask later, so capture the tab this open writes; it is
      // not always the tab that was showing beforehand.
      if (openIntentRef.current && nextInspector.name === HISTORY_INSPECTOR_NAME) {
        openIntentRef.current.tab = resolveChangesInspectorTab(nextParams.changesInspectorTab)
      }

      setParams(nextParams)
    },
    [currentInspector, inspectors, params, setParams],
  )
  const handleHistoryClose = useCallback(() => {
    if (historyInspector) {
      closeInspector(historyInspector.name)
    }
  }, [closeInspector, historyInspector])

  const handleHistoryOpen = useCallback(
    (openPath: DocumentHistoryOpenPath = 'status_line') => {
      if (!features.reviewChanges) {
        return
      }

      if (historyInspector) {
        openIntentRef.current = {path: openPath}
        openInspector(historyInspector.name, {changesInspectorTab: 'review'})
      }
    },
    [features.reviewChanges, openInspector, historyInspector],
  )

  const inspectOpen = params.inspect === 'on'

  const toggleLegacyInspect = useCallback(
    (toggle = !inspectOpen) => {
      if (toggle) {
        setParams({...params, inspect: 'on'})
      } else {
        setParams({...params, inspect: undefined})
      }
    },
    [inspectOpen, params, setParams],
  )

  const handleLegacyInspectClose = useCallback(
    () => toggleLegacyInspect(false),
    [toggleLegacyInspect],
  )

  const handleInspectorAction = useCallback(
    (item: PaneMenuItem) => {
      if (item.action === 'inspect') {
        toggleLegacyInspect(true)
        return true
      }

      if (typeof item.action !== 'string') return false
      const nextInspectorName = item.action.slice(INSPECT_ACTION_PREFIX.length)
      const nextInspector = inspectors.find((i) => i.name === nextInspectorName)

      if (nextInspector) {
        if (nextInspector.name === inspectorName) {
          closeInspector(nextInspector.name)
        } else {
          if (nextInspector.name === HISTORY_INSPECTOR_NAME) {
            openIntentRef.current = {path: 'pane_menu'}
          }
          openInspector(nextInspector.name)
        }
        return true
      }
      return false
    },
    [closeInspector, inspectorName, inspectors, openInspector, toggleLegacyInspect],
  )

  return {
    changesOpen,
    currentInspector,
    inspectors,
    closeInspector,
    openInspector,
    handleHistoryClose,
    handleHistoryOpen,
    handleInspectorAction,
    // TODO: Deprecate this legacy inspect toggle it's used to render the <InspectDialog /> component
    handleLegacyInspectClose,
    inspectOpen,
  }
}
