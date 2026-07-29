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
import {type DocumentInRelease} from './types'

type PermissionDeps = {
  client: ReturnType<typeof useClient>
  schema: ReturnType<typeof useSchema>
  grantsStore: ReturnType<typeof useGrantsStore>
  userId: string | undefined
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
 *
 * @internal
 */
export async function filterDocumentsWithPairPermission(
  documents: DocumentInRelease[],
  permission: DocumentPermission,
  deps: PermissionDeps,
): Promise<DocumentInRelease[]> {
  const permissionResults = await Promise.all(
    documents.map(async (doc) => {
      const {granted} = await firstValueFrom(
        getDocumentPairPermissions(permissionOptionsForDocument(doc, permission, deps)),
      )

      return granted ? doc : null
    }),
  )

  return permissionResults.filter((doc): doc is DocumentInRelease => doc !== null)
}

/**
 * Whether any of the given release documents grant the pair permission (for bulk action affordances).
 *
 * @internal
 */
export function useAnyDocumentInReleaseHasPairPermission(
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
    if (documents.length === 0) {
      return of({granted: false, isLoading: false})
    }

    return combineLatest(
      documents.map((doc) =>
        getDocumentPairPermissions(permissionOptionsForDocument(doc, permission, deps)),
      ),
    ).pipe(
      map((results) => ({
        granted: results.some((result) => result.granted),
        isLoading: false,
      })),
      startWith({granted: false, isLoading: true}),
    )
  }, [deps, documents, permission])

  return useObservable(observable, {granted: false, isLoading: true})
}
