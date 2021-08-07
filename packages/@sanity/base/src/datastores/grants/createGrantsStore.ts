// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {defer, of} from 'rxjs'

import {mergeMap, publishReplay, switchMap} from 'rxjs/operators'
import {evaluate, parse} from 'groq-js'
import {SanityDocument} from '@sanity/types'
import {refCountDelay} from 'rxjs-etc/operators'
import sanityClient from 'part:@sanity/base/client'
import userStore from '../user'
import {
  GrantsStore,
  DocumentPermissionName,
  Grant,
  PermissionCheckResult,
  EvaluationParams,
} from './types'
import {debugGrants$} from './debug'

const client = sanityClient.withConfig({apiVersion: '2021-06-07'})

async function getDatasetGrants(projectId: string, dataset: string): Promise<Grant[]> {
  // `acl` stands for access control list and returns a list of grants
  const grants: Grant[] = await client.request({
    uri: `/projects/${projectId}/datasets/${dataset}/acl`,
    tag: 'acl.get',
    withCredentials: true,
  })

  return grants
}

async function getParams(): Promise<EvaluationParams> {
  const params: EvaluationParams = {}
  const user = await userStore.getCurrentUser()
  if (user !== null) {
    params.identity = user.id
  }

  return params
}

const PARSED_FILTERS_MEMO = new Map()
async function matchesFilter(filter: string, document: SanityDocument) {
  if (!PARSED_FILTERS_MEMO.has(filter)) {
    // note: it might be tempting to also memoize the result of the evaluation here,
    // Currently these filters are typically evaluated whenever a document change, which means they will be evaluated
    // quite frequently with different versions of the document. There might be some gains in finding out which subset of document
    // properties to use as key (e.g. by looking at the parsed filter and see what properties the filter cares about)
    // But as always, it's worth considering if the complexity/memory usage is worth the potential perf gain…
    PARSED_FILTERS_MEMO.set(filter, parse(`*[${filter}]`))
  }
  const parsed = PARSED_FILTERS_MEMO.get(filter)

  const params = await getParams()
  const data = await (await evaluate(parsed, {dataset: [document], params})).get()
  return data?.length === 1
}

export function createGrantsStore(): GrantsStore {
  const datasetGrants$ = defer(() => of(client.config())).pipe(
    mergeMap(({projectId, dataset}) => {
      if (!projectId || !dataset) {
        throw new Error('Missing projectId or dataset')
      }
      return getDatasetGrants(projectId, dataset)
    })
  )
  const currentUserDatasetGrants = debugGrants$.pipe(
    switchMap((debugGrants) => (debugGrants ? of(debugGrants) : datasetGrants$)),
    publishReplay(1),
    refCountDelay(1000)
  )

  return {
    checkDocumentPermission(permission: DocumentPermissionName, document: SanityDocument) {
      return currentUserDatasetGrants.pipe(
        switchMap((grants) => grantsPermissionOn(grants, permission, document))
      )
    },
  }
}

/**
 * takes a grants object, a permission and a document
 * checks whether the the permission is granted for the given document
 * @param grants the dataset grants object
 * @param permission the permission (e.g. update, read)
 * @param document the document to check
 */
async function grantsPermissionOn(
  grants: Grant[],
  permission: DocumentPermissionName,
  document: SanityDocument
): Promise<PermissionCheckResult> {
  if (!grants.length) {
    return {granted: false, reason: 'No document grants'}
  }

  const matchingGrants: Grant[] = []

  for (const grant of grants) {
    if (await matchesFilter(grant.filter, document)) {
      matchingGrants.push(grant)
    }
  }

  const foundMatch = matchingGrants.some((grant) => grant.permissions.some((p) => p === permission))

  return {
    granted: foundMatch,
    reason: foundMatch ? `Matching grant` : `No matching grants found`,
  }
}

export default createGrantsStore()
