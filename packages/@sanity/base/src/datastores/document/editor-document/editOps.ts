import {getDraftId, isDraftId} from 'part:@sanity/base/util/draft-utils'
import {omit} from 'lodash'
import {merge, Observable} from 'rxjs'
import {filter, map, scan} from 'rxjs/operators'
import client from 'part:@sanity/base/client'
import {documentPairEventsFor} from './documentEvents'
import schema from 'part:@sanity/base/schema'
import {DocumentMutationEvent, DocumentRebaseEvent, SnapshotEvent} from '../buffered-doc/types'

interface EditorDocumentOperations {
  publish: () => void
  delete: () => void
  patch: (patches: any[]) => void
  discardDraft: () => void
  commit: () => void
}

function hasSnapshot(
  event
): event is (SnapshotEvent | DocumentRebaseEvent | DocumentMutationEvent) & {
  target: 'published' | 'draft'
} {
  return event.type === 'snapshot' || event.type === 'rebase' || event.type === 'mutation'
}

export function editOpsOf(
  publishedId: string,
  typeName: string
): Observable<EditorDocumentOperations> {
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  const draftId = getDraftId(publishedId)

  return documentPairEventsFor({publishedId, draftId}).pipe(
    filter(hasSnapshot),
    scan((targets, event) => ({...targets, [event.target]: event}), {draft: null, published: null}),
    filter(({draft, published}) => draft && published),
    map(({draft, published}) => {
      const schemaType = schema.get(typeName)
      const liveEdit = !!schemaType.liveEdit
      return {
        publish: () => {
          if (liveEdit) {
            throw new Error('Cannot publish when liveEdit is enabled')
          }

          if (draft.document === null) {
            throw new Error(`Can't publish an empty draft`)
          }

          const tx = client.observable.transaction()

          if (!published || !published.document) {
            // If the document has not been published, we want to create it - if it suddenly exists
            // before being created, we don't want to overwrite if, instead we want to yield an error
            tx.create({
              ...omit(draft.document, '_updatedAt'),
              _id: publishedId
            })
          } else {
            // If it exists already, we only want to update it if the revision on the remote server
            // matches what our local state thinks it's at
            tx.patch(publishedId, {
              // Hack until other mutations support revision locking
              unset: ['_reserved_prop_'],
              ifRevisionID: published.document._rev
            }).createOrReplace({
              ...omit(draft.document, '_updatedAt'),
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
              ...omit(published.document, '_updatedAt'),
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
