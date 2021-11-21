/* eslint-disable max-nested-callbacks */
import {SanityDocument, SchemaType} from '@sanity/types'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {Observable, combineLatest, of} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import {snapshotPair} from '../document/document-pair/snapshotPair'
import {PermissionCheckResult} from './types'
import grantsStore from './grantsStore'

const {checkDocumentPermission} = grantsStore

function getSchemaType(typeName: string): SchemaType {
  const schemaMod = require('part:@sanity/base/schema')
  const schema = schemaMod.default || schemaMod
  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`No such schema type: ${typeName}`)
  }
  return type
}

interface PairPermissionsOptions {
  permission: DocumentPermission
  draft: SanityDocument
  published: SanityDocument
  liveEdit: boolean
}

function getPairPermissions({
  permission,
  draft,
  published,
  liveEdit,
}: PairPermissionsOptions): Array<[string, Observable<PermissionCheckResult>] | null> {
  switch (permission) {
    case 'delete': {
      if (liveEdit) {
        return [
          ['delete published document (live-edit)', checkDocumentPermission('update', published)],
        ]
      }

      return [
        ['delete draft document', checkDocumentPermission('update', draft)],
        ['delete published document', checkDocumentPermission('update', published)],
      ]
    }

    case 'discardDraft': {
      if (liveEdit) return []

      return [['delete draft document', checkDocumentPermission('update', draft)]]
    }

    case 'publish': {
      if (liveEdit) return []

      return [
        // precondition
        [
          'update published document at its current state',
          checkDocumentPermission('update', published),
        ],

        // post condition
        ['delete draft document', checkDocumentPermission('update', draft)],
        [
          'create published document from draft',
          checkDocumentPermission('create', draft && {...draft, _id: getPublishedId(draft._id)}),
        ],
      ]
    }

    case 'unpublish': {
      if (liveEdit) return []

      return [
        // precondition
        ['update draft document at its current state', checkDocumentPermission('create', draft)],

        // post condition
        ['delete published document', checkDocumentPermission('update', published)],
        [
          'create draft document from published version',
          checkDocumentPermission(
            'create',
            published && {...published, _id: getDraftId(published._id)}
          ),
        ],
      ]
    }

    case 'update': {
      if (liveEdit) {
        return [
          ['update published document (live-edit)', checkDocumentPermission('update', published)],
        ]
      }

      return [['update draft document', checkDocumentPermission('update', draft)]]
    }

    case 'duplicate': {
      if (liveEdit) {
        return [
          [
            'create new published document from existing document (live-edit)',
            checkDocumentPermission('create', {...published, _id: 'dummy-id'}),
          ],
        ]
      }

      return [
        [
          'create new draft document from existing draft',
          checkDocumentPermission('create', {...draft, _id: getDraftId('dummy-id')}),
        ],
      ]
    }

    default: {
      throw new Error(`Could not match permission: ${permission}`)
    }
  }
}

export type DocumentPermission =
  | 'delete'
  | 'discardDraft'
  | 'publish'
  | 'unpublish'
  | 'update'
  | 'duplicate'

export interface DocumentPermissionsOptions {
  id: string
  type: string
  permission: DocumentPermission
}

// if a document doesn't exist and a permission depends on that document,
// the permission will return as true
function getDocumentPairPermissions({
  id,
  type,
  permission,
}: DocumentPermissionsOptions): Observable<PermissionCheckResult> {
  const liveEdit = Boolean(getSchemaType(type).liveEdit)

  return snapshotPair({draftId: getDraftId(id), publishedId: getPublishedId(id)}, type).pipe(
    switchMap((pair) =>
      combineLatest([pair.draft.snapshots$, pair.published.snapshots$]).pipe(
        map(([draft, published]) => ({draft, published}))
      )
    ),
    switchMap(({draft, published}) => {
      const pairPermissions = getPairPermissions({
        permission,
        draft,
        published,
        liveEdit,
      }).map(([label, observable]) =>
        observable.pipe(
          map(({granted, reason}) => ({
            granted,
            reason: granted ? '' : `not allowed to ${label}: ${reason}`,
            label,
            permission,
          }))
        )
      )

      if (!pairPermissions.length) return of({granted: true, reason: ''})

      return combineLatest(pairPermissions).pipe(
        map((results) => {
          const granted = results.every((i) => i.granted)
          const reason = granted
            ? ''
            : `Unable to ${permission}:\n\t${results
                .filter((i) => !i.granted)
                .map((i) => i.reason)
                .join('\n\t')}`

          return {granted, reason}
        })
      )
    })
  )
}

const useDocumentPairPermissions = createHookFromObservableFactory(getDocumentPairPermissions)

export {
  /* eslint-disable camelcase */
  getDocumentPairPermissions as unstable_getDocumentPairPermissions,
  useDocumentPairPermissions as unstable_useDocumentPairPermissions,
  /* eslint-enable camelcase */
}
