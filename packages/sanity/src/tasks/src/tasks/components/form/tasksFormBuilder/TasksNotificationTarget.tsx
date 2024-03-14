import {isImageSource} from '@sanity/asset-utils'
import imageUrlBuilder from '@sanity/image-url'
import {useEffect, useMemo} from 'react'
import deepEquals from 'react-fast-compare'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  type ObjectFieldProps,
  set,
  useClient,
  useFormValue,
  useWorkspace,
} from 'sanity'

import {useDocumentPreviewValues} from '../../../hooks/useDocumentPreviewValues'
import {type TaskContext, type TaskDocument} from '../../../types'
import {CurrentWorkspaceProvider} from '../CurrentWorkspaceProvider'

function TasksNotificationTargetInner(props: ObjectFieldProps<TaskDocument>) {
  const {inputProps} = props
  const {onChange} = inputProps
  const {target, _id, context} = useFormValue([]) as TaskDocument
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

  useEffect(() => {
    if (documentId && documentType && previewValuesLoading) {
      // Wait until the preview values are loaded
      return
    }

    const studioUrl = new URL(`${window.location.origin}${basePath}/`)
    studioUrl.searchParams.set('sidebar', 'tasks')
    studioUrl.searchParams.set('selectedTask', _id)
    studioUrl.searchParams.set('viewMode', 'edit')

    const notificationTarget: TaskContext['notification'] = {
      url: studioUrl.toString(),
      workspaceTitle,
      targetContentImageUrl: imageUrl,
      targetContentTitle: targetContentTitle,
    }
    if (deepEquals(notificationTarget, context?.notification)) return

    onChange(set(notificationTarget, ['notification']))
  }, [
    _id,
    basePath,
    workspaceTitle,
    documentId,
    documentType,
    previewValuesLoading,
    targetContentTitle,
    imageUrl,
    onChange,
    context,
  ])

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
