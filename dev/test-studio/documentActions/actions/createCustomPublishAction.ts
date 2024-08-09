/* eslint-disable react-hooks/rules-of-hooks */
import {type DocumentActionComponent, type DocumentActionProps, useDocumentOperation} from 'sanity'

export function createCustomPublishAction(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  return function CustomPublishAction(props: DocumentActionProps) {
    const defaultPublishAction = originalAction(props)
    const documentOperations = useDocumentOperation(props.id, props.type)

    return {
      ...defaultPublishAction,
      label: 'Custom publish that sets publishedAt to now',
      onHandle: () => {
        documentOperations.patch.execute([{set: {publishedAt: new Date().toISOString()}}])
        defaultPublishAction?.onHandle?.()
      },
    }
  }
}

export function createNoopPatchPublishAction(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  return function NoopPatchPublishAction(props) {
    const defaultPublishAction = originalAction(props)
    const documentOperations = useDocumentOperation(props.id, props.type)

    return {
      ...defaultPublishAction,
      label: 'Custom publish that sets someBoolean to true',
      onHandle: () => {
        documentOperations.patch.execute([{set: {someBoolean: true}}])
        defaultPublishAction?.onHandle?.()
      },
    }
  }
}
