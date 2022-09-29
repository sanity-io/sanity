import {SanityClient} from '@sanity/client'
import {CurrentUser, SanityDocument} from '@sanity/types'
import {evaluate, parse} from 'groq-js'
import {defer, of} from 'rxjs'
import {distinctUntilChanged, publishReplay, switchMap} from 'rxjs/operators'
import {refCountDelay} from 'rxjs-etc/operators'
import shallowEquals from 'shallow-equals'
import {debugGrants$} from './debug'
import {
  GrantsStore,
  DocumentValuePermission,
  Grant,
  PermissionCheckResult,
  EvaluationParams,
} from './types'

async function getDatasetGrants(
  client: SanityClient,
  projectId: string,
  dataset: string
): Promise<Grant[]> {
  // `acl` stands for access control list and returns a list of grants
  const grants: Grant[] = await client.request({
    uri: `/projects/${projectId}/datasets/${dataset}/acl`,
    tag: 'acl.get',
    withCredentials: true,
  })

  return grants
}

function getParams(currentUser: CurrentUser | null): EvaluationParams {
  const params: EvaluationParams = {}

  if (currentUser !== null) {
    params.identity = currentUser.id
  }

  return params
}

const PARSED_FILTERS_MEMO = new Map()
async function matchesFilter(
  currentUser: CurrentUser | null,
  filter: string,
  document: SanityDocument
) {
  if (!PARSED_FILTERS_MEMO.has(filter)) {
    // note: it might be tempting to also memoize the result of the evaluation here,
    // Currently these filters are typically evaluated whenever a document change, which means they will be evaluated
    // quite frequently with different versions of the document. There might be some gains in finding out which subset of document
    // properties to use as key (e.g. by looking at the parsed filter and see what properties the filter cares about)
    // But as always, it's worth considering if the complexity/memory usage is worth the potential perf gain…
    PARSED_FILTERS_MEMO.set(filter, parse(`*[${filter}]`))
  }
  const parsed = PARSED_FILTERS_MEMO.get(filter)

  const params = getParams(currentUser)
  const data = await (await evaluate(parsed, {dataset: [document], params})).get()
  return data?.length === 1
}

/** @internal */
export interface GrantsStoreOptions {
  client: SanityClient
  currentUser: CurrentUser | null
}

/** @internal */
export function createGrantsStore({client, currentUser}: GrantsStoreOptions): GrantsStore {
  const versionedClient = client.withConfig({apiVersion: '2021-06-07'})

  const datasetGrants$ = defer(() => of(versionedClient.config())).pipe(
    switchMap(({projectId, dataset}) => {
      if (!projectId || !dataset) {
        throw new Error('Missing projectId or dataset')
      }
      return getDatasetGrants(versionedClient, projectId, dataset)
    })
  )

  const currentUserDatasetGrants = debugGrants$.pipe(
    switchMap((debugGrants) => (debugGrants ? of(debugGrants) : datasetGrants$)),
    publishReplay(1),
    refCountDelay(1000)
  )

  return {
    checkDocumentPermission(permission: DocumentValuePermission, document: SanityDocument) {
      return currentUserDatasetGrants.pipe(
        switchMap((grants) => grantsPermissionOn(currentUser, grants, permission, document)),
        distinctUntilChanged(shallowEquals)
      )
    },
  }
}

/**
 * takes a grants object, a permission and a document
 * checks whether the the permission is granted for the given document
 */
async function grantsPermissionOn(
  currentUser: CurrentUser | null,
  grants: Grant[],
  permission: DocumentValuePermission,
  document: SanityDocument | null
): Promise<PermissionCheckResult> {
  if (!document) {
    // we say it's granted if null due to initial states
    return {granted: true, reason: 'Null document, nothing to check'}
  }

  if (!grants.length) {
    return {granted: false, reason: 'No document grants'}
  }

  const matchingGrants: Grant[] = []

  for (const grant of grants) {
    if (await matchesFilter(currentUser, grant.filter, document)) {
      matchingGrants.push(grant)
    }
  }

  const foundMatch = matchingGrants.some((grant) => grant.permissions.some((p) => p === permission))

  return {
    granted: foundMatch,
    reason: foundMatch ? `Matching grant` : `No matching grants found`,
  }
}
