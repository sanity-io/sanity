import {getDraftId, isDraftId} from 'part:@sanity/base/util/draft-utils'
import {omit} from 'lodash'
import {merge, Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import client from 'part:@sanity/base/client'
import {CachedPair, getPair} from './cached-pair'
import schema from 'part:@sanity/base/schema'

interface EditorDocumentOperations {
  publish: () => void
  delete: () => void
  patch: (patches: any[]) => void
  discardDraft: () => void
  commit: () => void
}

export function editOpsOf(
  publishedId: string,
  typeName: string
): Observable<EditorDocumentOperations> {
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  const draftId = getDraftId(publishedId)

  return getPair({publishedId, draftId}).pipe(
    map(({draft, published}: CachedPair) => {
      const schemaType = schema.get(typeName)
      const liveEdit = !!schemaType.liveEdit
      return {
        publish: () => {
          if (liveEdit) {
            throw new Error('Cannot publish when liveEdit is enabled')
          }

          if (draft.snapshot === null) {
            throw new Error(`Can't publish an empty draft`)
          }

          const tx = client.observable.transaction()

          if (!published || !published.snapshot) {
            // If the document has not been published, we want to create it - if it suddenly exists
            // before being created, we don't want to overwrite if, instead we want to yield an error
            tx.create({
              ...omit(draft.snapshot, '_updatedAt'),
              _id: publishedId
            })
          } else {
            // If it exists already, we only want to update it if the revision on the remote server
            // matches what our local state thinks it's at
            tx.patch(publishedId, {
              // Hack until other mutations support revision locking
              unset: ['_reserved_prop_'],
              ifRevisionID: published.snapshot._rev
            }).createOrReplace({
              ...omit(draft.snapshot, '_updatedAt'),
              _id: publishedId
            })
          }

          tx.delete(draftId)

          tx.commit().subscribe()
        },
        delete() {
          published.delete()
          draft.delete()
        },
        create(document) {
          const target = liveEdit ? published : draft
          target.create(document)
        },
        patch(patches) {
          // const initialValue = this.getInitialValue()
          if (liveEdit) {
            // No drafting, patch and commit the published document
            published.createIfNotExists({
              _id: publishedId,
              _type: typeName
            })
            published.patch(patches)
          } else {
            draft.createIfNotExists({
              ...omit(published.snapshot, '_updatedAt'),
              _id: draftId,
              _type: typeName
            })
            draft.patch(patches)
          }
        },
        discardDraft() {
          draft.delete()
        },
        commit() {
          return merge(published.commit(), draft.commit()).subscribe()
        }
      }
    })
  )
}
