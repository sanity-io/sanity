import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema, type SchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {combineLatest, type Observable, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'

import {useClient, useSchema} from '../../../hooks'
import {useWorkspace} from '../../../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {
  createHookFromObservableFactory,
  getDraftId,
  getIdPair,
  getPublishedId,
  type PartialExcept,
} from '../../../util'
import {useGrantsStore} from '../datastores'
import {type DocumentStoreExtraOptions, snapshotPair} from '../document'
import {type GrantsStore, type PermissionCheckResult} from './types'

function getSchemaType(schema: Schema, typeName: string): SchemaType {
  const type = schema.get(typeName)

  if (!type) {
    throw new Error(`No such schema type: ${typeName}`)
  }

  return type
}

interface PairPermissionsOptions {
  grantsStore: GrantsStore
  permission: DocumentPermission
  draft: SanityDocument | null
  version: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
}

function getPairPermissions({
  grantsStore,
  permission,
  draft,
  version,
  published,
  liveEdit,
}: PairPermissionsOptions): Array<[string, Observable<PermissionCheckResult>]> {
  // this was introduced because we ran into a bug where a user with publish
  // access was marked as not allowed to duplicate a document unless it had a
  // draft variant. this would happen in non-live edit cases where the document
  // pair only had a published variant with the draft variant being null.
  //
  // note: this should _not_ be used if the draft and published versions should
  // be considered separately/explicitly in the permissions.
  const effectiveVersion = version || draft || published
  const effectiveVersionType =
    effectiveVersion === version ? version : effectiveVersion === draft ? 'draft' : 'published'

  const {checkDocumentPermission} = grantsStore

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

    case 'discardVersion': {
      if (liveEdit) return []

      return [['delete version', checkDocumentPermission('update', version || null)]]
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
            published && {...published, _id: getDraftId(published._id)},
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

      return [
        [
          `update ${effectiveVersionType} document`,
          checkDocumentPermission('update', effectiveVersion),
        ],
      ]
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
          `create new draft document from existing ${effectiveVersionType} document`,
          checkDocumentPermission('create', {...effectiveVersion, _id: getDraftId('dummy-id')}),
        ],
      ]
    }

    default: {
      throw new Error(`Could not match permission: ${permission}`)
    }
  }
}

/** @internal */
export type DocumentPermission =
  | 'delete'
  | 'discardDraft'
  | 'discardVersion'
  | 'publish'
  | 'unpublish'
  | 'update'
  | 'duplicate'

/** @internal */
export interface DocumentPairPermissionsOptions {
  client: SanityClient
  schema: Schema
  grantsStore: GrantsStore
  id: string
  type: string
  version?: string
  permission: DocumentPermission
  serverActionsEnabled: Observable<boolean>
  pairListenerOptions?: DocumentStoreExtraOptions
}

/**
 * The observable version of `useDocumentPairPermissions`
 *
 * @see useDocumentPairPermissions
 *
 * @internal
 */
export function getDocumentPairPermissions({
  client,
  grantsStore,
  schema,
  id,
  permission,
  type,
  serverActionsEnabled,
  version: v,
  pairListenerOptions,
}: DocumentPairPermissionsOptions): Observable<PermissionCheckResult> {
  // this case was added to fix a crash that would occur if the `schemaType` was
  // omitted from `S.documentList()`
  //
  // see `resolveTypeForDocument` which returns `'*'` if no type is provided
  // https://github.com/sanity-io/sanity/blob/4d49b83a987d5097064d567f75d21b268a410cbf/packages/%40sanity/base/src/datastores/document/resolveTypeForDocument.ts#L7
  if (type === '*') {
    return of({granted: false, reason: 'Type specified was `*`'})
  }

  const liveEdit = Boolean(getSchemaType(schema, type).liveEdit)

  return snapshotPair(
    client,
    getIdPair(id, {version: v}),
    type,
    serverActionsEnabled,
    pairListenerOptions,
  ).pipe(
    switchMap((pair) =>
      combineLatest([
        pair.draft.snapshots$,
        pair.published.snapshots$,
        pair.version?.snapshots$ || of(null),
      ]).pipe(map(([draft, published, version]) => ({draft, published, version}))),
    ),
    switchMap(({draft, published, version}) => {
      const pairPermissions = getPairPermissions({
        grantsStore,
        permission,
        draft,
        version,
        published,
        liveEdit,
      }).map(([label, observable]) =>
        observable.pipe(
          map(({granted, reason}) => ({
            granted,
            reason: granted ? '' : `not allowed to ${label}: ${reason}`,
            label,
            permission,
          })),
        ),
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
        }),
      )
    }),
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
 *
 * @internal
 */
export const useDocumentPairPermissionsFromHookFactory = createHookFromObservableFactory(
  getDocumentPairPermissions,
)

/** @internal */
export function useDocumentPairPermissions({
  id,
  type,
  version,
  permission,
  client: overrideClient,
  schema: overrideSchema,
  grantsStore: overrideGrantsStore,
  pairListenerOptions,
}: PartialExcept<DocumentPairPermissionsOptions, 'id' | 'type' | 'permission'>): ReturnType<
  typeof useDocumentPairPermissionsFromHookFactory
> {
  const defaultClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const defaultSchema = useSchema()
  const defaultGrantsStore = useGrantsStore()
  const workspace = useWorkspace()

  const client = useMemo(() => overrideClient || defaultClient, [defaultClient, overrideClient])
  const schema = useMemo(() => overrideSchema || defaultSchema, [defaultSchema, overrideSchema])
  const grantsStore = useMemo(
    () => overrideGrantsStore || defaultGrantsStore,
    [defaultGrantsStore, overrideGrantsStore],
  )

  const serverActionsEnabled = useMemo(() => {
    const configFlag = workspace.__internal_serverDocumentActions?.enabled
    return typeof configFlag === 'boolean' ? of(configFlag) : of(true)
  }, [workspace.__internal_serverDocumentActions?.enabled])

  return useDocumentPairPermissionsFromHookFactory(
    useMemo(
      () => ({
        client,
        schema,
        grantsStore,
        id,
        permission,
        type,
        serverActionsEnabled,
        pairListenerOptions,
        version,
      }),
      [
        client,
        schema,
        grantsStore,
        id,
        permission,
        type,
        serverActionsEnabled,
        pairListenerOptions,
        version,
      ],
    ),
  )
}
