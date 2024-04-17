import {isImageSource} from '@sanity/asset-utils'
import imageUrlBuilder from '@sanity/image-url'
import {useCallback, useEffect, useMemo} from 'react'
import deepEquals from 'react-fast-compare'
import {useRouterState} from 'sanity/router'

import {isDev} from '../../../../environment'
import {type ObjectFieldProps, set, useFormValue} from '../../../../form'
import {useClient} from '../../../../hooks'
import {useWorkspace} from '../../../../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {useDocumentPreviewValues} from '../../../hooks'
import {type TaskContext, type TaskDocument} from '../../../types'
import {CurrentWorkspaceProvider} from '../CurrentWorkspaceProvider'

export function getTaskURL(taskId: string, basePath?: string, toolName: string = ''): string {
  let path = window.location.origin
  if (basePath) path += basePath
  if (toolName) path += `/${toolName}`

  const currentUrl = new URL(`${path}/`)

  currentUrl.searchParams.set('sidebar', 'tasks')
  currentUrl.searchParams.set('selectedTask', taskId)
  currentUrl.searchParams.set('viewMode', 'edit')
  return currentUrl.toString()
}

function TasksNotificationTargetInner(props: ObjectFieldProps<TaskDocument>) {
  const {inputProps} = props
  const {onChange} = inputProps
  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )
  const {target, _id, context, _rev} = useFormValue([]) as TaskDocument
  const {title: workspaceTitle, basePath} = useWorkspace()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])
  const documentId = target?.document?._ref ?? ''
  const documentType = target?.documentType ?? ''

  const {isLoading: previewValuesLoading, value} = useDocumentPreviewValues({
    documentId,
    documentType,
  })
  const targetContentTitle = value?.title || null
  const imageUrl = isImageSource(value?.media)
    ? imageBuilder.image(value.media).width(96).height(96).url()
    : null

  const notificationTarget: TaskContext['notification'] = useMemo(() => {
    const contextUrl = context?.notification?.url
    const studioUrl =
      // Avoid updating the contextURL in dev mode if it already exists, persist the deployed one.
      contextUrl && isDev ? contextUrl : getTaskURL(_id, basePath, activeToolName)

    return {
      url: studioUrl,
      workspaceTitle,
      targetContentImageUrl: imageUrl,
      targetContentTitle: targetContentTitle,
    }
  }, [
    context?.notification?.url,
    _id,
    basePath,
    activeToolName,
    workspaceTitle,
    imageUrl,
    targetContentTitle,
  ])

  useEffect(() => {
    if (documentId && documentType && previewValuesLoading) {
      // Wait until the preview values are loaded
      return
    }

    // If the task doesn't have a _rev it means it's not created, don't add the notification target yet.
    if (!_rev) {
      return
    }

    if (deepEquals(context?.notification, notificationTarget)) {
      return
    }
    // Something changed, update the notification target
    onChange(set(notificationTarget, ['notification']))
  }, [_rev, context, documentId, documentType, notificationTarget, previewValuesLoading, onChange])

  return null
}

// This component is listening to the changes to the form value and will update the notification target in the task document.
export function TasksNotificationTarget(props: ObjectFieldProps<TaskDocument>) {
  return (
    <CurrentWorkspaceProvider>
      <TasksNotificationTargetInner {...props} />
    </CurrentWorkspaceProvider>
  )
}
