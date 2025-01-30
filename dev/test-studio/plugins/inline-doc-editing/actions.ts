import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'

export function createUsageDocumentPublishAction(
  originalPublishAction: DocumentActionComponent,
): DocumentActionComponent {
  const UsageDocumentPublishAction: DocumentActionComponent = (props) => {
    const originalResult = originalPublishAction(props)
    return {
      ...originalResult,
      onHandle: () => {
        // TODO: implement publishing logic for the usage document
        // eslint-disable-next-line no-console
        console.log('Publishing usage document')
        if (originalResult?.onHandle) {
          originalResult.onHandle()
        }
      },
    } as DocumentActionDescription
  }
  UsageDocumentPublishAction.action = 'publish'
  return UsageDocumentPublishAction
}

export function createUsageDocumentDeleteAction(
  originalDeleteAction: DocumentActionComponent,
): DocumentActionComponent {
  const UsageDocumentDeleteAction: DocumentActionComponent = (props) => {
    const originalResult = originalDeleteAction({
      ...props,
      onComplete: () => {
        // eslint-disable-next-line no-console
        console.log('Deleting usage document')
        if (props.onComplete) {
          props.onComplete()
        }
      },
    })
    return originalResult
  }
  UsageDocumentDeleteAction.action = 'delete'
  return UsageDocumentDeleteAction
}
