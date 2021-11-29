/* eslint-disable max-nested-callbacks */
import type {SanityDocument, SchemaType} from '@sanity/types'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import type {Observable} from 'rxjs'
import {combineLatest, of} from 'rxjs'
import {switchMap, map} from 'rxjs/operators'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import {snapshotPair} from '../document/document-pair/snapshotPair'
import type {PermissionCheckResult} from './types'
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

/**
 * The observable version of `useDocumentPairPermissions`
 *
 * @see useDocumentPairPermissions
 */
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
        map((permissionResults) => {
          const granted = permissionResults.every((permissionResult) => permissionResult.granted)
          const reason = granted
            ? ''
            : `Unable to ${permission}:\n\t${permissionResults
                .filter((permissionResult) => !permissionResult.granted)
                .map((permissionResult) => permissionResult.reason)
                .join('\n\t')}`

          return {granted, reason}
        })
      )
    })
  )
}

/**
 * Gets document pair permissions based on a document ID and a type.
 *
 * This permissions API is a high-level permissions API that is draft-model
 * aware. In order to determine whether or not the user has the given
 * permission, both the draft and published documents are pulled and run through
 * all of the user's grants. If any pre or post conditions fail a permissions
 * checks, the operations will not be granted.
 *
 * The operations this hook accepts are only relevant to document pairs. E.g.
 * `'create'` is not included as an operation because it's not possible to tell
 * if a document can be created by only using the initial ID and type because an
 * initial template value may not have a matching grant (e.g. locked-document
 * pattern `!locked`). In contrast, the operation `'duplicate'` is supported
 * because the draft value of the document can be live queried and checked for
 * matching grants.
 *
 * Note: for live-edit documents, non-applicable operations (e.g. publish) will
 * return as true.
 *
 * @see useDocumentValuePermissions
 */
const useDocumentPairPermissions = createHookFromObservableFactory(getDocumentPairPermissions)

export {
  /* eslint-disable camelcase */
  getDocumentPairPermissions as unstable_getDocumentPairPermissions,
  useDocumentPairPermissions as unstable_useDocumentPairPermissions,
  /* eslint-enable camelcase */
}
