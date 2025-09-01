import {type CreateVersionAction} from '@sanity/client'
import {type Observable, tap} from 'rxjs'

import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

interface PendingDraftCreation {
  observable: Observable<any>
  bufferedPatches: any[][]
}

// Track pending draft creations and their associated patch buffers
const pendingDraftCreations = new Map<string, PendingDraftCreation>()

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
        const draftCreationKey = idPair.draftId
        const pendingCreation = pendingDraftCreations.get(draftCreationKey)
        if (pendingCreation) {
          // Buffer patches to be applied after version.create completes
          pendingCreation.bufferedPatches.push(patches)
          // Use createIfNotExists to ensure we have a local draft to patch
          draft.mutate([
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

        const publishedRev = snapshots.published._rev

        const versionCreateAction: CreateVersionAction = {
          actionType: 'sanity.action.document.version.create',
          publishedId: idPair.publishedId,
          versionId: idPair.draftId,
          baseId: idPair.publishedId,
          ifBaseRevisionId: publishedRev,
        }

        // Don't include the initial patches in the version.create action
        // We'll apply them optimistically instead, and pass them in the subsequent mutation
        const actions = [versionCreateAction]

        // Apply the initial patches optimistically to ensure immediate UI update
        if (patches.length > 0) {
          draft.mutate([
            draft.createIfNotExists({
              ...initialDocument,
              ...snapshots.published,
              _id: idPair.draftId,
              _type: typeName,
            }),
            ...patchMutation,
          ])
        }

        // Create the observable for the version.create action
        const creation$ = actionsApiClient(client, idPair)
          .observable.action(actions, {
            tag: 'document.commit',
          })
          .pipe(
            tap({
              complete: () => {
                const hasPendingDraftCreation = pendingDraftCreations.get(draftCreationKey)
                if (hasPendingDraftCreation && hasPendingDraftCreation.bufferedPatches.length > 0) {
                  // Apply all buffered patches that arrived while version.create was in flight
                  const allPatches = hasPendingDraftCreation.bufferedPatches.flat()
                  draft.mutate(draft.patch(allPatches))
                }
                pendingDraftCreations.delete(draftCreationKey)
              },
              error: () => {
                pendingDraftCreations.delete(draftCreationKey)
              },
            }),
          )

        // Store the pending creation with an empty buffer
        pendingDraftCreations.set(draftCreationKey, {
          observable: creation$,
          bufferedPatches: [],
        })

        // Subscribe to trigger the action
        creation$.subscribe()

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
