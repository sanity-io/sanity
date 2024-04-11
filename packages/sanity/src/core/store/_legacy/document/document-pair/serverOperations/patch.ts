import {type OperationImpl} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const patch: OperationImpl<[patches: any[], initialDocument?: Record<string, any>]> = {
  disabled: (): false => false,
  execute: (
    {schema, snapshots, idPair, draft, published, typeName},
    patches = [],
    initialDocument,
  ): void => {
    if (isLiveEditEnabled(schema, typeName)) {
      // No drafting, so patch and commit the published document
      const patchMutation = published.patch(patches)
      // Note: if the document doesn't exist on the server yet, we need to create it first. We only want to do this if we can't see it locally
      // if it's been deleted on the server we want that to become a mutation error when submitting.
      const mutations = snapshots.published
        ? patchMutation
        : [
            published.createIfNotExists({
              _type: typeName,
              ...initialDocument,
            }),
          ]
      // No drafting, so patch and commit the published document
      published.mutate(mutations)

      return
    }

    // If there's no published or draft document, create one.
    if (!snapshots.published && !snapshots.draft) {
      draft.patch([
        draft.createIfNotExists({
          ...initialDocument,
          _id: idPair.draftId,
          _type: typeName,
        }),
        draft.patch(patches),
      ])

      return
    }

    // If there's no draft, the user's edits will be based on the published document in the form
    // in front of them. This is handled in Content Lake by the `sanity.action.document.edit`
    // action.
    const document = snapshots.draft ? draft : published
    document.mutate(document.patch(patches))
  },
}
