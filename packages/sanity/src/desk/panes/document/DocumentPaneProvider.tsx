import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {omit} from 'lodash'
import isHotkey from 'is-hotkey'
import {usePaneRouter} from '../../components'
import {PaneMenuItem} from '../../types'
import {useDeskTool} from '../../useDeskTool'
import {BaseDeskToolPaneProps} from '../types'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'
import {getMenuItems} from './menuItems'
import {
  DEFAULT_MENU_ITEM_GROUPS,
  EMPTY_PARAMS,
  HISTORY_INSPECTOR_NAME,
  INSPECT_ACTION_PREFIX,
} from './constants'
import {DocumentInspectorMenuItemsResolver} from './DocumentInspectorMenuItemsResolver'
import {
  DocumentInspector,
  useSource,
  useUnique,
  DocumentFieldAction,
  DocumentInspectorMenuItem,
  FieldActionsResolver,
  EMPTY_ARRAY,
  DocumentFieldActionNode,
  FieldActionsProvider,
} from 'sanity'
import {useDocumentId, useDocumentType, useFormState} from 'sanity/document'

/** @internal */
export type DocumentPaneProviderProps = {
  children?: React.ReactNode
} & BaseDeskToolPaneProps<'document'>

/**
 * @internal
 */
export const DocumentPaneProvider = memo(
  ({children, index, pane: _pane, paneKey}: DocumentPaneProviderProps) => {
    const documentId = useDocumentId()
    const documentType = useDocumentType()

    const pane = useMemo(
      () => ({
        ..._pane,
        options: {
          ..._pane.options,
          type: documentType,
        },
      }),
      [documentType, _pane],
    )

    const {
      actions: documentActions,
      badges: documentBadges,
      unstable_fieldActions: fieldActionsResolver,
      unstable_languageFilter: languageFilterResolver,
      inspectors: inspectorsResolver,
    } = useSource().document
    const paneRouter = usePaneRouter()
    const setPaneParams = paneRouter.setParams
    const {features} = useDeskTool()
    const {menuItemGroups = DEFAULT_MENU_ITEM_GROUPS, title = null, views: viewsProp = []} = pane
    const params = useUnique(paneRouter.params) || EMPTY_PARAMS
    const {schemaType} = useFormState()

    const [inspectorMenuItems, setInspectorMenuItems] = useState<DocumentInspectorMenuItem[]>([])

    // Resolve document actions
    const actions = useMemo(
      () => documentActions({schemaType: documentType, documentId}),
      [documentActions, documentId, documentType],
    )

    // Resolve document badges
    const badges = useMemo(
      () => documentBadges({schemaType: documentType, documentId}),
      [documentBadges, documentId, documentType],
    )

    // Resolve document language filter
    const languageFilter = useMemo(
      () => languageFilterResolver({schemaType: documentType, documentId}),
      [documentId, documentType, languageFilterResolver],
    )

    const views = useUnique(viewsProp)

    const activeViewId = params.view || (views[0] && views[0].id) || null

    // TODO: this may cause a lot of churn. May be a good idea to prevent these
    // requests unless the menu is open somehow
    // const previewUrl = usePreviewUrl(value)

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

    // TODO: fix this
    const previewUrl = ''

    // const hasValue = Boolean(value)
    const menuItems = (() => {
      return getMenuItems({
        currentInspector,
        features,
        hasValue: true,
        inspectorMenuItems,
        inspectors,
        previewUrl,
      })
    })()
    const inspectOpen = params.inspect === 'on'

    const fieldActions: DocumentFieldAction[] = useMemo(
      () => (schemaType ? fieldActionsResolver({documentId, documentType, schemaType}) : []),
      [documentId, documentType, fieldActionsResolver, schemaType],
    )

    const closeInspector = useCallback(
      (closeInspectorName?: string) => {
        // inspector?: DocumentInspector
        const inspector =
          closeInspectorName && inspectors.find((i) => i.name === closeInspectorName)

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
        openInspector(resolvedChangesInspector.name)
      }
    }, [features.reviewChanges, openInspector, resolvedChangesInspector])

    const handlePaneClose = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

    const handlePaneSplit = useCallback(() => paneRouter.duplicateCurrent(), [paneRouter])

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

    const handleMenuAction = useCallback(
      (item: PaneMenuItem) => {
        if (item.action === 'production-preview' && previewUrl) {
          window.open(previewUrl)
          return true
        }

        if (item.action === 'inspect') {
          toggleLegacyInspect(true)
          return true
        }

        if (item.action === 'reviewChanges') {
          handleHistoryOpen()
          return true
        }

        if (typeof item.action === 'string' && item.action.startsWith(INSPECT_ACTION_PREFIX)) {
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
        }

        return false
      },
      [
        closeInspector,
        handleHistoryOpen,
        inspectorName,
        inspectors,
        openInspector,
        toggleLegacyInspect,
      ],
    )

    const handleKeyUp = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        for (const item of menuItems) {
          if (item.shortcut) {
            if (isHotkey(item.shortcut, event)) {
              event.preventDefault()
              event.stopPropagation()
              handleMenuAction(item)
              return
            }
          }
        }
      },
      [handleMenuAction, menuItems],
    )

    const handleLegacyInspectClose = useCallback(
      () => toggleLegacyInspect(false),
      [toggleLegacyInspect],
    )

    // const docId = value._id ? value._id : 'dummy-id'

    const documentPane: DocumentPaneContextValue = {
      actions,
      activeViewId,
      badges,
      changesOpen,
      closeInspector,
      fieldActions,
      inspector: currentInspector || null,
      inspectors,
      menuItems,
      onHistoryClose: handleHistoryClose,
      onHistoryOpen: handleHistoryOpen,
      onInspectClose: handleLegacyInspectClose,
      onKeyUp: handleKeyUp,
      onMenuAction: handleMenuAction,
      onPaneClose: handlePaneClose,
      onPaneSplit: handlePaneSplit,
      openInspector,
      index,
      inspectOpen,
      menuItemGroups: menuItemGroups || [],
      paneKey,
      previewUrl,
      title,
      views,
      unstable_languageFilter: languageFilter,
    }

    const [rootFieldActionNodes, setRootFieldActionNodes] = useState<DocumentFieldActionNode[]>([])

    return (
      <DocumentPaneContext.Provider value={documentPane}>
        {inspectors.length > 0 && (
          <DocumentInspectorMenuItemsResolver
            documentId={documentId}
            documentType={documentType}
            inspectors={inspectors}
            onMenuItems={setInspectorMenuItems}
          />
        )}

        {/* Resolve root-level field actions */}
        {fieldActions.length > 0 && schemaType && (
          <FieldActionsResolver
            actions={fieldActions}
            documentId={documentId}
            documentType={documentType}
            onActions={setRootFieldActionNodes}
            path={EMPTY_ARRAY}
            schemaType={schemaType}
          />
        )}

        <FieldActionsProvider actions={rootFieldActionNodes} path={EMPTY_ARRAY}>
          {children}
        </FieldActionsProvider>
      </DocumentPaneContext.Provider>
    )
  },
)

DocumentPaneProvider.displayName = 'DocumentPaneProvider'
