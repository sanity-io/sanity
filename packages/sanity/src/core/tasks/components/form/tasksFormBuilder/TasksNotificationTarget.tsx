import {isImageSource} from '@sanity/asset-utils'
import imageUrlBuilder from '@sanity/image-url'
import {useEffect, useMemo} from 'react'
import deepEquals from 'react-fast-compare'

import {isDev} from '../../../../environment'
import {type ObjectFieldProps, set, useFormValue} from '../../../../form'
import {useClient} from '../../../../hooks'
import {useWorkspace} from '../../../../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {useDocumentPreviewValues} from '../../../hooks/useDocumentPreviewValues'
import {type TaskContext, type TaskDocument} from '../../../types'
import {CurrentWorkspaceProvider} from '../CurrentWorkspaceProvider'

function TasksNotificationTargetInner(props: ObjectFieldProps<TaskDocument>) {
  const {inputProps} = props
  const {onChange} = inputProps
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
    const contextUrl = context?.notification?.url ? new URL(context?.notification?.url) : ''
    const currentUrl = new URL(`${window.location.origin}${basePath}/`)

    const studioUrl =
      // Avoid updating the contextURL in dev mode if it already exists, persist the deployed one.
      contextUrl && isDev ? contextUrl : currentUrl

    studioUrl.searchParams.set('sidebar', 'tasks')
    studioUrl.searchParams.set('selectedTask', _id)
    studioUrl.searchParams.set('viewMode', 'edit')

    return {
      url: studioUrl.toString(),
      workspaceTitle,
      targetContentImageUrl: imageUrl,
      targetContentTitle: targetContentTitle,
    }
  }, [_id, basePath, imageUrl, targetContentTitle, workspaceTitle, context])

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
