import {type OperationImpl} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const patch: OperationImpl<[patches: any[], initialDocument?: Record<string, any>]> = {
  disabled: (): false => false,
  execute: (
    {schema, snapshots, idPair, draft, published, version, typeName},
    patches = [],
    initialDocument,
  ): void => {
    if (version) {
      // No drafting, so patch and commit the version document.
      const patchMutation = version.patch(patches)
      // Note: if the document doesn't exist on the server yet, we need to create it first. We only want to do this if we can't see it locally
      // if it's been deleted on the server we want that to become a mutation error when submitting.
      const ensureVersion = snapshots.version
        ? version.patch([
            {
              unset: ['_empty_action_guard_pseudo_field_'],
            },
          ])
        : [
            version.create({
              ...initialDocument,
              _id: idPair.draftId,
              _type: typeName,
            }),
          ]
      // No drafting, so patch and commit the published document
      version.mutate([...ensureVersion, ...patchMutation])

      return
    }

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

    const patchMutation = draft.patch(patches)

    if (snapshots.published) {
      draft.mutate([
        // If there's no draft, the user's edits will be based on the published document in the form in front of them
        // so before patching it we need to make sure it's created based on the current published version first.
        draft.createIfNotExists({
          ...initialDocument,
          ...snapshots.published,
          _id: idPair.draftId,
          _type: typeName,
        }),
        ...patchMutation,
      ])
      return
    }
    const ensureDraft = snapshots.draft
      ? draft.patch([
          {
            unset: ['_empty_action_guard_pseudo_field_'],
          },
        ])
      : [
          draft.create({
            ...initialDocument,
            _id: idPair.draftId,
            _type: typeName,
          }),
        ]
    draft.mutate([...ensureDraft, ...patchMutation])
  },
}
