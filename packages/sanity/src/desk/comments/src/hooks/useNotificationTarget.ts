import {useCallback, useMemo} from 'react'
import {useMemoObservable} from 'react-rx'
import {of} from 'rxjs'
import {useRouterState} from 'sanity/router'
import {useSchema, useWorkspace, useDocumentPreviewStore, getPreviewStateObservable} from 'sanity'

interface NotificationTargetHookOptions {
  documentId: string
  documentType: string
}

interface NotificationTargetHookValue {
  documentTitle: string
  toolName: string
  url: string
  workspaceTitle: string
}

/** @internal */
export function useNotificationTarget(
  opts: NotificationTargetHookOptions,
): NotificationTargetHookValue {
  const {documentId, documentType} = opts || {}
  const schemaType = useSchema().get(documentType)
  const {basePath, title: workspaceTitle, tools} = useWorkspace()

  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )
  const activeTool = useMemo(
    () => tools.find((tool) => tool.name === activeToolName),
    [activeToolName, tools],
  )

  const documentPreviewStore = useDocumentPreviewStore()

  const previewState = useMemoObservable(() => {
    if (!documentId || !schemaType) return of(null)
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId, '')
  }, [documentId, documentPreviewStore, schemaType])

  const {published, draft} = previewState || {}
  const documentTitle = (draft?.title || published?.title || 'Sanity document') as string

  const currentUrl = new URL(window.location.href)
  const deskToolSegment = currentUrl.pathname.split('/').slice(2, 3).join('')
  currentUrl.pathname = `${basePath}/${deskToolSegment}/__edit__${documentId},type=${documentType}`
  const notificationUrl = currentUrl.toString()

  return {
    documentTitle,
    toolName: activeTool?.name || '',
    url: notificationUrl,
    workspaceTitle,
  }
}
