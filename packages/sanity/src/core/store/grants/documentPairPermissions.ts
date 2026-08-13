import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema, type SchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {combineLatest, type Observable, of} from 'rxjs'
import {map, shareReplay, switchMap} from 'rxjs/operators'

import {useClient} from '../../hooks/useClient'
import {useSchema} from '../../hooks/useSchema'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {createHookFromObservableFactory} from '../../util/createHookFromObservableFactory'
import {getDraftId, getPublishedId, getIdPair, getVersionFromId} from '../../util/draftUtils'
import {type PartialExcept} from '../../util/PartialExcept'
import {
  getVariantVersionInfo,
  type VariantVersionInfo,
} from '../../variants/documents/getVariantVersionInfo'
import {useGrantsStore} from '../datastores'
import {snapshotPair} from '../document/document-pair/snapshotPair'
import {type DocumentStoreExtraOptions} from '../document/getPairListener'
import {memoize} from '../document/utils/createMemoizer'
import {useCurrentUser} from '../user/hooks'
import {type GrantsStore, type PermissionCheckResult} from './types'

function shareLatestWithRefCount<T>() {
  return shareReplay<T>({bufferSize: 1, refCount: true})
}

function getSchemaType(schema: Schema, typeName: string): SchemaType {
  const type = schema.get(typeName)

  if (!type) {
    throw new Error(`No such schema type: ${typeName}`)
  }

  return type
}

/**
 * A stand-in document for the variant sibling that a publish or unpublish writes to: the
 * checked-out variant document's content, re-identified as the sibling.
 *
 * Sibling scope ids are opaque, server-generated hashes that occupy no pair slot, so the real
 * `_id` is only available when the caller resolved it (`publishedVariantId`) or the version
 * advertises it (`_system.draft`). On a first publish the sibling does not exist yet and its id
 * cannot be derived — the version's own id stands in. The two differ only in that scope segment,
 * which is unknowable to whoever authors a grant filter; everything a filter can meaningfully
 * match on (the `versions.` path shape, `_type`, `_system.variant`, and `_system.bundleId`, which
 * is rewritten here) describes the sibling accurately.
 */
function asVariantSibling(
  version: SanityDocument,
  siblingId: string | undefined,
  bundleId: 'drafts' | undefined,
): SanityDocument {
  return {
    ...version,
    _id: siblingId ?? version._id,
    _system: {
      // The sibling is the same variant of the same group in a different bundle, so only the
      // fields that say so are carried over — `release`, `delete` and `draft` describe the
      // checked-out document, not its sibling. `bundleId` is left unset for the
      // variant-of-published, which is exactly how the real document represents itself.
      group: version._system?.group,
      variant: version._system?.variant,
      bundleId,
      scopeId: siblingId === undefined ? undefined : getVersionFromId(siblingId),
    },
  }
}

/**
 * Permission templates for a variant target, where the checked-out `version` is a variant
 * document (`versions.<opaqueScopeId>.<groupId>`).
 *
 * Variant operations never touch the base draft/published pair — they go to the
 * `sanity.action.document.variant.*` actions addressed by `{publishedId, variantId, bundleId}`
 * (see `serverOperations/{publish,unpublish,discardChanges}.ts`). Running the base templates for
 * these would evaluate grants against `<groupId>` / `drafts.<groupId>`, making a user's access to
 * a variant follow their access to the base document. Every check below addresses the
 * variant-scoped documents the mutation actually reads and writes.
 *
 * Returns `undefined` for the permissions that stay group-level even under a variant selection,
 * so the caller falls through to the base templates.
 */
function getVariantPairPermissions({
  grantsStore,
  permission,
  version,
  variantVersion,
  publishedVariantId,
}: {
  grantsStore: GrantsStore
  permission: DocumentPermission
  version: SanityDocument
  variantVersion: VariantVersionInfo
  publishedVariantId: string | undefined
}): Array<[string, Observable<PermissionCheckResult>]> | undefined {
  const {checkDocumentPermission} = grantsStore

  switch (permission) {
    case 'update': {
      return [['update variant document', checkDocumentPermission('update', version)]]
    }

    case 'discardDraft':
    case 'discardVersion': {
      // Discarding a variant deletes the variant document in its own bundle
      // (`sanity.action.document.variant.delete`); the base draft is untouched.
      return [['delete variant document', checkDocumentPermission('update', version)]]
    }

    case 'publish': {
      // Publishes the drafts-bundle variant into its variant-of-published sibling.
      const publishedVariant = asVariantSibling(version, publishedVariantId, undefined)

      return [
        // precondition
        [
          'update published variant at its current state',
          // Only a check against an existing sibling is meaningful: on a first publish there is
          // no published variant to update, exactly as the base template passes a `null`
          // published document through.
          checkDocumentPermission('update', publishedVariantId ? publishedVariant : null),
        ],

        // post condition
        ['delete draft variant document', checkDocumentPermission('update', version)],
        [
          'create published variant from draft variant',
          checkDocumentPermission('create', publishedVariant),
        ],
      ]
    }

    case 'unpublish': {
      // The variant-of-published is hard-unpublished: it is deleted and its content recreated as
      // the drafts-bundle variant, whose id the version advertises on `_system.draft`.
      if (variantVersion.bundleId === 'published') {
        const draftVariant = asVariantSibling(version, version._system?.draft?._ref, 'drafts')

        return [
          // precondition
          [
            'update draft variant at its current state',
            checkDocumentPermission('create', draftVariant),
          ],

          // post condition
          ['delete published variant document', checkDocumentPermission('update', version)],
          [
            'create draft variant from published variant',
            checkDocumentPermission('create', draftVariant),
          ],
        ]
      }

      // Every other bundle is a soft unpublish, which only marks the variant itself with
      // `_system.delete`. (A drafts-scoped variant has nothing published to unpublish; the
      // operation is disabled with `NOT_PUBLISHED` before it gets this far.)
      return [
        ['mark variant document for unpublishing', checkDocumentPermission('update', version)],
      ]
    }

    default: {
      // `delete` destroys the whole document group (base published, base draft and every
      // version), and `duplicate` creates a new *base* draft from the variant's content. Both are
      // group-level by design, so the base templates — which check the base pair — are correct.
      return undefined
    }
  }
}

interface PairPermissionsOptions {
  grantsStore: GrantsStore
  permission: DocumentPermission
  draft: SanityDocument | null
  version: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
  publishedVariantId: string | undefined
}

function getPairPermissions({
  grantsStore,
  permission,
  draft,
  version,
  published,
  liveEdit,
  publishedVariantId,
}: PairPermissionsOptions): Array<[string, Observable<PermissionCheckResult>]> {
  // Variant-ness is read off the checked-out version snapshot's `_system`, the same
  // single discriminator the operations route on — never off the perspective.
  const variantVersion = getVariantVersionInfo(version)
  if (version && variantVersion) {
    const variantPermissions = getVariantPairPermissions({
      grantsStore,
      permission,
      version,
      variantVersion,
      publishedVariantId,
    })
    if (variantPermissions) return variantPermissions
  }

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
  /**
   * Id of the variant-of-published sibling (`versions.<opaqueScopeId>.<groupId>`) of a variant
   * target, resolved by the caller from `targetDocumentState.publishedSibling`. It is the
   * document a variant publish writes to, and it lives in no pair slot — its scope id is an
   * opaque, server-generated hash that can never be derived here. Only relevant for the
   * `publish` permission on a variant target; ignored otherwise.
   */
  publishedVariantId?: string
  /**
   * Identity of the current user. Included in the memoization key so that an
   * in-place user switch (same project, no reload) does not replay a previous
   * user's grants from the module-level memo cache.
   */
  userId?: string
  /**
   * @deprecated Does nothing. Preserved to avoid breaking changes.
   * Will be removed in the next major version.
   */
  serverActionsEnabled?: Observable<boolean>
  pairListenerOptions?: DocumentStoreExtraOptions
}

/**
 * The observable version of `useDocumentPairPermissions`
 *
 * @see useDocumentPairPermissions
 *
 * @internal
 */
function getDocumentPairPermissionsUncached({
  client,
  grantsStore,
  schema,
  id,
  permission,
  type,
  version: v,
  publishedVariantId,
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
    undefined,
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
        publishedVariantId,
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

export const getDocumentPairPermissions = memoize(
  (options: DocumentPairPermissionsOptions): Observable<PermissionCheckResult> =>
    getDocumentPairPermissionsUncached(options).pipe(shareLatestWithRefCount()),
  ({
    client,
    schema,
    id,
    type,
    version,
    publishedVariantId,
    permission,
    userId,
  }: DocumentPairPermissionsOptions): string => {
    const {dataset = '', projectId = ''} = client.config()
    // `liveEdit` is derived from the schema and branches the resulting permission
    // observable, so it must be part of the key: workspaces sharing a
    // project/dataset can define the same `type` with a different `liveEdit`.
    const liveEdit = type === '*' ? false : Boolean(schema.get(type)?.liveEdit)
    // `id` is normalized to its published id because the underlying chain reduces
    // (id, version) to `getIdPair(id, {version})`, a pure function of
    // (getPublishedId(id), version). The raw `version` string is kept as-is;
    // never call getIdPair here (it throws on version 'drafts'|'published').
    return [
      dataset,
      projectId,
      getPublishedId(id),
      version ?? '',
      publishedVariantId ?? '',
      userId ?? '',
      type,
      permission,
      liveEdit,
    ].join('-')
  },
)

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
  publishedVariantId,
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
  const currentUser = useCurrentUser()

  const client = useMemo(() => overrideClient || defaultClient, [defaultClient, overrideClient])
  const schema = useMemo(() => overrideSchema || defaultSchema, [defaultSchema, overrideSchema])
  const grantsStore = useMemo(
    () => overrideGrantsStore || defaultGrantsStore,
    [defaultGrantsStore, overrideGrantsStore],
  )
  const userId = currentUser?.id

  return useDocumentPairPermissionsFromHookFactory(
    useMemo(
      () => ({
        client,
        schema,
        grantsStore,
        id,
        permission,
        type,
        pairListenerOptions,
        version,
        publishedVariantId,
        userId,
      }),
      [
        client,
        schema,
        grantsStore,
        id,
        permission,
        type,
        pairListenerOptions,
        version,
        publishedVariantId,
        userId,
      ],
    ),
  )
}
