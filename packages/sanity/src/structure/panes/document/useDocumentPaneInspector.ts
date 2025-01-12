import {omit} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type DocumentInspector, useSource, useUnique} from 'sanity'

import {usePaneRouter} from '../../components'
import {type PaneMenuItem} from '../../types'
import {useStructureTool} from '../../useStructureTool'
import {EMPTY_PARAMS, HISTORY_INSPECTOR_NAME, INSPECT_ACTION_PREFIX} from './constants'

export function useDocumentPaneInspector({
  documentId,
  documentType,
}: {
  documentId: string
  documentType: string
}) {
  const paneRouter = usePaneRouter()
  const {features} = useStructureTool()

  const setPaneParams = paneRouter.setParams

  const params = useUnique(paneRouter.params) || EMPTY_PARAMS
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

  const currentInspector = inspectors?.find((i) => i.name === inspectorName)
  const resolvedChangesInspector = inspectors.find((i) => i.name === HISTORY_INSPECTOR_NAME)

  const changesOpen = currentInspector?.name === HISTORY_INSPECTOR_NAME

  const closeInspector = useCallback(
    (closeInspectorName?: string) => {
      // inspector?: DocumentInspector
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

        setPaneParams({...result.params, inspect: undefined})

        return
      }

      if (currentInspector) {
        const result = currentInspector.onClose?.({params}) ?? {params}

        setInspectorName(null)
        inspectParamRef.current = undefined

        setPaneParams({...result.params, inspect: undefined})
      }
    },
    [currentInspector, inspectors, params, setPaneParams],
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
        setPaneParams({...params, ...paneParams, inspect: nextInspector.name})
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

      setPaneParams({...result.params, ...paneParams, inspect: nextInspector.name})
    },
    [currentInspector, inspectors, params, setPaneParams],
  )
  const handleHistoryClose = useCallback(() => {
    if (resolvedChangesInspector) {
      closeInspector(resolvedChangesInspector.name)
    }
  }, [closeInspector, resolvedChangesInspector])

  const handleHistoryOpen = useCallback(() => {
    if (!features.reviewChanges) {
      return
    }

    if (resolvedChangesInspector) {
      openInspector(resolvedChangesInspector.name, {changesInspectorTab: 'review'})
    }
  }, [features.reviewChanges, openInspector, resolvedChangesInspector])

  const inspectOpen = params.inspect === 'on'

  const toggleLegacyInspect = useCallback(
    (toggle = !inspectOpen) => {
      if (toggle) {
        setPaneParams({...params, inspect: 'on'})
      } else {
        setPaneParams(omit(params, 'inspect'))
      }
    },
    [inspectOpen, params, setPaneParams],
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
    // TODO: Deprecate this legacy inspect toggle
    handleLegacyInspectClose,
  }
}
