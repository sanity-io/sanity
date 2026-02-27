import {memoize} from 'lodash-es'
import {type DocumentActionComponent, useDocumentOperation} from 'sanity'

// It's important to wrap the created actions with `memoize`, otherwise `GetHookCollectionState` will see brand new action functions every time the `<DocumentPaneProvider>` `actions` state is resolved.
// If a new function instance is created it leads to the action remounting, which is less performant.

export const createCustomPublishAction = memoize(
  (useOriginalAction: DocumentActionComponent): DocumentActionComponent => {
    const useCustomPublishAction: DocumentActionComponent = (props) => {
      const defaultPublishAction = useOriginalAction(props)
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

    useCustomPublishAction.displayName = 'CustomPublishAction'
    return useCustomPublishAction
  },
)

export const createNoopPatchPublishAction = memoize(
  (useOriginalAction: DocumentActionComponent): DocumentActionComponent => {
    const useNoopPatchPublishAction: DocumentActionComponent = (props) => {
      const defaultPublishAction = useOriginalAction(props)
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

    useNoopPatchPublishAction.displayName = 'NoopPatchPublishAction'
    return useNoopPatchPublishAction
  },
)
