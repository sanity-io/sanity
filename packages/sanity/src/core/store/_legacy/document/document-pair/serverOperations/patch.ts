import {type CreateVersionAction, type EditAction} from '@sanity/client'

import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const patch: OperationImpl<[patches: any[], initialDocument?: Record<string, any>]> = {
  disabled: (): false => false,
  execute: (
    {schema, snapshots, idPair, draft, published, version, typeName, client},
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
      // Handle special "create draft from published" scenario with version.create
      if (!snapshots.draft) {
        const publishedRev = snapshots.published._rev

        const versionCreateAction: CreateVersionAction = {
          actionType: 'sanity.action.document.version.create',
          publishedId: idPair.publishedId,
          versionId: idPair.draftId,
          baseId: idPair.publishedId,
          ifBaseRevisionId: publishedRev,
        }

        const editActions = patchMutation.map(
          (mutation): EditAction => ({
            actionType: 'sanity.action.document.edit',
            draftId: idPair.draftId,
            publishedId: idPair.publishedId,
            patch: {
              ...mutation.patch,
              id: undefined, // Remove id to match toActions behavior
            },
          }),
        )

        const actions = [versionCreateAction, ...editActions]

        // Fire the action asynchronously but don't wait for it (like other mutations)
        actionsApiClient(client, idPair)
          .observable.action(actions, {
            tag: 'document.commit',
          })
          .subscribe()

        return
      }

      //the draft already exists so we can directly apply the patch mutations
      draft.mutate(patchMutation)
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
