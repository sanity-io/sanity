import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, firstValueFrom, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'

import {useClient} from '../../../hooks/useClient'
import {useSchema} from '../../../hooks/useSchema'
import {useGrantsStore} from '../../../store/datastores'
import {
  type DocumentPermission,
  getDocumentPairPermissions,
} from '../../../store/grants/documentPairPermissions'
import {useCurrentUser} from '../../../store/user/hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {getPublishedId, getVersionFromId} from '../../../util/draftUtils'
import {isDocumentEligibleForUnpublish} from './releaseDocumentActions'
import {type DocumentInRelease} from './types'

export type ReleaseBulkAction = 'discard' | 'unpublish'

type PermissionDeps = {
  client: ReturnType<typeof useClient>
  schema: ReturnType<typeof useSchema>
  grantsStore: ReturnType<typeof useGrantsStore>
  userId: string | undefined
}

// A release can hold a document whose schema type is no longer registered (a renamed/removed type,
// or a foreign document). getDocumentPairPermissions -> getSchemaType THROWS "No such schema type"
// for those, and because the bulk-permission hooks run during render, that throw crashes the whole
// pane. Such documents can't be permission-checked or acted on via the pair-permission path, so
// exclude them up front — they simply aren't bulk-actionable targets.
function hasResolvableSchemaType(
  schema: PermissionDeps['schema'],
  doc: DocumentInRelease,
): boolean {
  return Boolean(schema.get(doc.document._type))
}

function permissionOptionsForDocument(
  doc: DocumentInRelease,
  permission: DocumentPermission,
  deps: PermissionDeps,
) {
  const publishedId = getPublishedId(doc.document._id)
  const type = doc.document._type
  const version = getVersionFromId(doc.document._id)

  return {
    client: deps.client,
    schema: deps.schema,
    grantsStore: deps.grantsStore,
    id: publishedId,
    type,
    version,
    permission,
    userId: deps.userId,
  }
}

/**
 * Keeps only release documents the current user may act on with the given pair permission.
 * Module-private — consumed by {@link filterDocumentsForBulkAction} below.
 */
async function filterDocumentsWithPairPermission(
  documents: DocumentInRelease[],
  permission: DocumentPermission,
  deps: PermissionDeps,
): Promise<DocumentInRelease[]> {
  const permissionResults = await Promise.all(
    documents
      .filter((doc) => hasResolvableSchemaType(deps.schema, doc))
      .map(async (doc) => {
        const {granted} = await firstValueFrom(
          getDocumentPairPermissions(permissionOptionsForDocument(doc, permission, deps)),
        )

        return granted ? doc : null
      }),
  )

  return permissionResults.filter((doc): doc is DocumentInRelease => doc !== null)
}

/**
 * Keeps release documents that will be affected by a bulk discard or unpublish action.
 *
 * @internal
 */
export async function filterDocumentsForBulkAction(
  documents: DocumentInRelease[],
  action: ReleaseBulkAction,
  deps: PermissionDeps,
): Promise<DocumentInRelease[]> {
  const permission = action === 'discard' ? 'discardVersion' : 'unpublish'
  const permitted = await filterDocumentsWithPairPermission(documents, permission, deps)

  if (action === 'unpublish') {
    return permitted.filter(isDocumentEligibleForUnpublish)
  }

  return permitted
}

/**
 * Whether every given release document grants the pair permission (for bulk action affordances).
 *
 * @internal
 */
export function useAllDocumentsInReleaseHavePairPermission(
  documents: DocumentInRelease[],
  permission: DocumentPermission,
): {granted: boolean; isLoading: boolean} {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const grantsStore = useGrantsStore()
  const currentUser = useCurrentUser()

  const deps = useMemo(
    () => ({
      client,
      schema,
      grantsStore,
      userId: currentUser?.id,
    }),
    [client, schema, grantsStore, currentUser?.id],
  )

  const observable = useMemo(() => {
    const resolvable = documents.filter((doc) => hasResolvableSchemaType(deps.schema, doc))
    if (resolvable.length === 0) {
      return of({granted: false, isLoading: false})
    }

    return combineLatest(
      resolvable.map((doc) =>
        getDocumentPairPermissions(permissionOptionsForDocument(doc, permission, deps)),
      ),
    ).pipe(
      map((results) => ({
        granted: results.every((result) => result.granted),
        isLoading: false,
      })),
      startWith({granted: false, isLoading: true}),
    )
  }, [deps, documents, permission])

  return useObservable(observable, {granted: false, isLoading: true})
}

/**
 * Release documents that would be affected if the bulk action ran now (permissions + unpublish rules).
 *
 * @internal
 */
export function useReleaseBulkActionTargets(
  documents: DocumentInRelease[],
  action: ReleaseBulkAction,
): {targets: DocumentInRelease[]; isLoading: boolean} {
  const permission = action === 'discard' ? 'discardVersion' : 'unpublish'
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const grantsStore = useGrantsStore()
  const currentUser = useCurrentUser()

  const deps = useMemo(
    () => ({
      client,
      schema,
      grantsStore,
      userId: currentUser?.id,
    }),
    [client, schema, grantsStore, currentUser?.id],
  )

  const observable = useMemo(() => {
    const resolvable = documents.filter((doc) => hasResolvableSchemaType(deps.schema, doc))
    if (resolvable.length === 0) {
      return of({targets: [] as DocumentInRelease[], isLoading: false})
    }

    return combineLatest(
      resolvable.map((doc) =>
        getDocumentPairPermissions(permissionOptionsForDocument(doc, permission, deps)).pipe(
          map((result) => ({doc, granted: result.granted})),
        ),
      ),
    ).pipe(
      map((results) => {
        let targets = results.filter((result) => result.granted).map((result) => result.doc)

        if (action === 'unpublish') {
          targets = targets.filter(isDocumentEligibleForUnpublish)
        }

        return {targets, isLoading: false}
      }),
      startWith({targets: [] as DocumentInRelease[], isLoading: true}),
    )
  }, [action, deps, documents, permission])

  return useObservable(observable, {targets: [], isLoading: true})
}
