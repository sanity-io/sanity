import {type DocumentOperationImpl} from '../operations/types'

export const patch: DocumentOperationImpl<[patches: any[], initialDocument?: Record<string, any>]> =
  {
    disabled: (): false => false,
    execute: (
      {documentId, snapshot, document, typeName, publishedId},
      patches = [],
      initialDocument,
    ): void => {
      const patchMutation = document.patch(patches)
      if (snapshot) {
        document.mutate([
          ...document.patch([{unset: ['_empty_action_guard_pseudo_field_']}]),
          ...patchMutation,
        ])
        return
      }
      // At this point we don't have a document, so we need to create it.
      // Only use the createMutation if the document doesn't exist.
      // Creation will happen in a different transaction than the patch, to get the correct initial value for it.
      const createMutation = publishedId
        ? // TODO: Wait until CL adds support to edit the draft document directly without creating it first.
          // It will automatically resolve to the correct document without us having to deal with a creation.

          // If there's no draft, the user's edits will be based on the published document in the form in front of them
          // so before patching it we need to make sure it's created based on the current published version first.
          document.createIfNotExists({
            // Update this initial document to represent the published when a published exists. This needs to come from the ui
            ...initialDocument,
            _id: documentId,
            _type: typeName,
          })
        : // If the published doesn't exist we need to trigger a `create` action, because we are internally
          // transforming the createIfNotExists action to a patch, which requires the published document to exist.
          // see checkoutPair.ts toActions function for more details.
          document.create({
            ...initialDocument,
            _id: documentId,
            _type: typeName,
          })

      document.mutate([createMutation])
      // Commit so we create the draft in a different transaction than the patch, and we get the correct initial value for it.
      document.commit()
      // We do it in two steps to first create the draft with the copied version and then reflect the user edit to preserve the history.
      document.mutate(patchMutation)
    },
  }
