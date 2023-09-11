import {useCallback, useMemo} from 'react'
import {useMemoObservable} from 'react-rx'
import {of} from 'rxjs'
import {useDocumentPreviewStore} from '../../store'
import {getPreviewStateObservable} from '../../preview'
import {useWorkspace} from '../../studio'
import {useSchema} from '../../hooks'
import {useRouterState} from 'sanity/router'

interface NotificationTargetHookOptions {
  documentId: string
  documentType: string
}

interface NotificationTargetHookValue {
  url: string
  title: string
  toolName: string
}

/** @internal */
export function useNotificationTarget(
  opts: NotificationTargetHookOptions,
): NotificationTargetHookValue {
  const {documentId, documentType} = opts || {}
  const schemaType = useSchema().get(documentType)
  const {basePath, tools} = useWorkspace()

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
  const notificationTitle = (draft?.title || published?.title || 'Sanity document') as string

  const currentUrl = new URL(window.location.href)
  const deskToolSegment = currentUrl.pathname.split('/').slice(2, 3).join('')
  currentUrl.pathname = `${basePath}/${deskToolSegment}/__edit__${documentId},type=${documentType}`
  const notificationUrl = currentUrl.toString()

  return {
    url: notificationUrl,
    title: notificationTitle,
    toolName: activeTool?.name || '',
  }
}
