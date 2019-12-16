import {omit} from 'lodash'
import {combineLatest, merge, Observable, concat, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import client from 'part:@sanity/base/client'
import schema from 'part:@sanity/base/schema'
import {snapshotPair} from './snapshotPair'
import {IdPair} from '../types'

export interface EditorDocumentOperations {
  publish: () => void
  delete: () => void
  patch: (patches: any[]) => void
  discardDraft: () => void
  commit: () => void
}

const GUARDED = ['publish', 'delete', 'create', 'patch', 'discardDraft', 'commit'].reduce(
  (a, name) => {
    a[name] = () => {
      // todo: improve this error message
      throw new Error(`Premature invocation of ${name}`)
    }
    return a
  },
  {}
) as EditorDocumentOperations

export function editOpsOf(idPair: IdPair, typeName: string): Observable<EditorDocumentOperations> {
  const {publishedId, draftId} = idPair
  return concat(
    of(GUARDED),
    snapshotPair(idPair).pipe(
      switchMap(({draft, published}) => {
        const schemaType = schema.get(typeName)
        const liveEdit = !!schemaType.liveEdit
        return combineLatest([draft.snapshots$, published.snapshots$]).pipe(
          map(([draftSnapshot, publishSnapshot]) => {
            return {
              publish: () => {
                if (liveEdit) {
                  throw new Error('Cannot publish when liveEdit is enabled')
                }

                if (draftSnapshot === null) {
                  throw new Error(`Can't publish an empty draft`)
                }

                const tx = client.observable.transaction()

                if (!published || !publishSnapshot) {
                  // If the document has not been published, we want to create it - if it suddenly exists
                  // before being created, we don't want to overwrite if, instead we want to yield an error
                  tx.create({
                    ...omit(draftSnapshot, '_updatedAt'),
                    _id: publishedId
                  })
                } else {
                  // If it exists already, we only want to update it if the revision on the remote server
                  // matches what our local state thinks it's at
                  tx.patch(publishedId, {
                    // Hack until other mutations support revision locking
                    unset: ['_reserved_prop_'],
                    ifRevisionID: publishSnapshot._rev
                  }).createOrReplace({
                    ...omit(draftSnapshot, '_updatedAt'),
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
                const version = liveEdit ? published : draft
                version.create(document)
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
                    ...omit(publishSnapshot, '_updatedAt'),
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
      })
    )
  )
}
