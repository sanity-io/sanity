import {defer, of} from 'rxjs'

import {mergeMap, publishReplay, switchMap} from 'rxjs/operators'
import {evaluate, parse} from 'groq-js'
import {SanityDocument} from '@sanity/types'
import {refCountDelay} from 'rxjs-etc/operators'
import {versionedClient} from '../../client/versionedClient'
import {
  DatasetGrants,
  DOCUMENT_FILTER_RULE_KEY,
  GrantsStore,
  DocumentPermissionName,
  DocumentFilterRule,
  PermissionCheckResult,
} from './types'
import {debugGrants$} from './debug'

// todo: pin to stable version
const sanityClient = versionedClient.withConfig({apiVersion: 'X'})

function fetchApiEndpoint<T>(endpoint: string): Promise<T> {
  return sanityClient.request({
    uri: endpoint,
    withCredentials: true,
  })
}

function getDatasetGrants(projectId: string, dataset: string): Promise<DatasetGrants> {
  return fetchApiEndpoint(`/projects/${projectId}/datasets/${dataset}/grants`)
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
  const data = await (await evaluate(parsed, {dataset: [document]})).get()
  return data?.length === 1
}

export function createGrantsStore(): GrantsStore {
  const datasetGrants = defer(() => of(sanityClient.config())).pipe(
    mergeMap(({projectId, dataset}) => {
      if (!projectId || !dataset) {
        throw new Error('Missing projectId or dataset')
      }
      return getDatasetGrants(projectId, dataset)
    })
  )
  const currentUserDatasetGrants = debugGrants$.pipe(
    switchMap((debugGrants) => (debugGrants ? of(debugGrants) : datasetGrants)),
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
  grants: DatasetGrants,
  permission: DocumentPermissionName,
  document: SanityDocument
): Promise<PermissionCheckResult> {
  if (!(DOCUMENT_FILTER_RULE_KEY in grants)) {
    return {granted: false, reason: 'No document grants'}
  }
  const matchingRules: DocumentFilterRule[] = []
  for (const rule of grants[DOCUMENT_FILTER_RULE_KEY]) {
    const config = rule.config
    if (config?.filter && (await matchesFilter(config.filter, document))) {
      matchingRules.push(rule)
    }
  }
  const matches = matchingRules.some((rule) =>
    rule.grants.some((grant) => grant.name === permission)
  )
  return {
    granted: matches,
    reason: matches ? `Matching grant` : `No matching grants found`,
  }
}

export default createGrantsStore()
