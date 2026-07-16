import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type CurrentUserAttribute, type SanityDocument} from '@sanity/types'
import {evaluate, parse} from 'groq-js'
import {defer, of} from 'rxjs'
import {refCountDelay} from 'rxjs-etc/operators'
import {distinctUntilChanged, publishReplay, switchMap} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'

import {type StoreRequestErrorHandler} from '../requestErrorHandler'
import {debugGrants$} from './debug'
import {
  type DocumentValuePermission,
  type EvaluationParams,
  type Grant,
  type GrantsStore,
  type PermissionCheckResult,
} from './types'

/** Matches `user::attributes()` in role grant filters (attribute-based RBAC). */
const USER_ATTRIBUTES_FN = 'user::attributes()'

async function getDatasetGrants(
  client: SanityClient,
  projectId: string,
  dataset: string,
  errorHandler: StoreRequestErrorHandler | undefined,
): Promise<Grant[]> {
  // `acl` stands for access control list and returns a list of grants
  const fetchGrants = () =>
    client.request<Grant[]>({
      uri: `/projects/${projectId}/datasets/${dataset}/acl`,
      tag: 'acl.get',
    })

  // Every permission check depends on this read, so there is no local
  // recovery if it fails — delegate failures to the error handler when one
  // is provided. Retryable: it's an idempotent GET, safe to re-run.
  return errorHandler ? errorHandler.attempt(fetchGrants, {retryable: true}) : fetchGrants()
}

function getParams(userId: string | null): EvaluationParams {
  const params: EvaluationParams = {}

  if (userId !== null) {
    params.identity = userId
  }

  return params
}

/**
 * Convert `CurrentUser.attributes` into a plain object for GROQ evaluation.
 * @internal
 */
export function userAttributesToObject(
  attributes: CurrentUserAttribute[] | undefined,
): Record<string, unknown> {
  if (!attributes?.length) {
    return {}
  }

  return Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute.value]))
}

/**
 * groq-js does not implement `user::attributes()`. When we have attribute
 * values, rewrite the function call to a GROQ object literal so filters can
 * be evaluated client-side.
 * @internal
 */
export function applyUserAttributesToFilter(
  filter: string,
  userAttributes: Record<string, unknown>,
): string {
  if (!grantFilterUsesUserAttributes(filter)) {
    return filter
  }

  return filter.replaceAll(USER_ATTRIBUTES_FN, JSON.stringify(userAttributes))
}

/** @internal */
export function grantFilterUsesUserAttributes(filter: string): boolean {
  return filter.includes(USER_ATTRIBUTES_FN)
}

const PARSED_FILTERS_MEMO = new Map()
async function matchesFilter(
  userId: string | null,
  filter: string,
  document: SanityDocument,
  userAttributes?: Record<string, unknown>,
) {
  const effectiveFilter =
    userAttributes && grantFilterUsesUserAttributes(filter)
      ? applyUserAttributesToFilter(filter, userAttributes)
      : filter

  if (!PARSED_FILTERS_MEMO.has(effectiveFilter)) {
    // note: it might be tempting to also memoize the result of the evaluation here,
    // Currently these filters are typically evaluated whenever a document change, which means they will be evaluated
    // quite frequently with different versions of the document. There might be some gains in finding out which subset of document
    // properties to use as key (e.g. by looking at the parsed filter and see what properties the filter cares about)
    // But as always, it's worth considering if the complexity/memory usage is worth the potential perf gain…
    PARSED_FILTERS_MEMO.set(effectiveFilter, parse(`*[${effectiveFilter}]`))
  }
  const parsed = PARSED_FILTERS_MEMO.get(effectiveFilter)

  const evalParams = getParams(userId)
  const {identity} = evalParams
  const params: Record<string, unknown> = {...evalParams}

  try {
    const data = await (await evaluate(parsed, {dataset: [document], identity, params})).get()
    return data?.length === 1
  } catch {
    // groq-js throws for unimplemented functions (e.g. user::attributes() when
    // we have no attribute values to rewrite). Fail closed for this filter so
    // a single unevaluable grant cannot abort the entire permission check.
    return false
  }
}
interface GrantsStoreOptionsCurrentUser {
  client: SanityClient
  /**
   * Optional handler for failures of requests made by the store. When
   * omitted, request failures propagate to the permission streams.
   */
  errorHandler?: StoreRequestErrorHandler
  /**
   * @deprecated The `currentUser` option is deprecated. Use `userId` instead.
   */
  currentUser: CurrentUser | null
}

interface GrantsStoreOptionsUserId {
  client: SanityClient
  /**
   * Optional handler for failures of requests made by the store. When
   * omitted, request failures propagate to the permission streams.
   */
  errorHandler?: StoreRequestErrorHandler
  userId: string | null
  /**
   * Organization-scoped user attributes for the authenticated user.
   * Used to evaluate grant filters that reference `user::attributes()`.
   */
  userAttributes?: CurrentUserAttribute[]
}

/** @internal */
export type GrantsStoreOptions = GrantsStoreOptionsCurrentUser | GrantsStoreOptionsUserId

/** @internal */
export function createGrantsStore(opts: GrantsStoreOptions): GrantsStore {
  const {client, errorHandler} = opts
  const versionedClient = client.withConfig({apiVersion: '2021-06-07'})
  const userId = 'userId' in opts ? opts.userId : opts?.currentUser?.id || null
  const userAttributes = userAttributesToObject(
    'userAttributes' in opts ? opts.userAttributes : opts.currentUser?.attributes,
  )

  const datasetGrants$ = defer(() => of(versionedClient.config())).pipe(
    switchMap(({projectId, dataset}) => {
      if (!projectId || !dataset) {
        throw new Error('Missing projectId or dataset')
      }
      return getDatasetGrants(versionedClient, projectId, dataset, errorHandler)
    }),
  )

  const currentUserDatasetGrants = debugGrants$.pipe(
    switchMap((debugGrants) => (debugGrants ? of(debugGrants) : datasetGrants$)),
    publishReplay(1),
    refCountDelay(1000),
  )

  return {
    checkDocumentPermission(permission: DocumentValuePermission, document: SanityDocument) {
      return currentUserDatasetGrants.pipe(
        switchMap((grants) =>
          grantsPermissionOn(userId, grants, permission, document, userAttributes),
        ),
        distinctUntilChanged(shallowEquals),
      )
    },
  }
}

/**
 * @internal
 * Takes a grants object, a permission and a document
 * checks whether the permission is granted for the given document
 */
export async function grantsPermissionOn(
  userId: string | null,
  grants: Grant[],
  permission: DocumentValuePermission,
  document: SanityDocument | null,
  userAttributes?: Record<string, unknown>,
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
    if (await matchesFilter(userId, grant.filter, document, userAttributes)) {
      matchingGrants.push(grant)
    }
  }

  const foundMatch = matchingGrants.some((grant) => grant.permissions.some((p) => p === permission))

  return {
    granted: foundMatch,
    reason: foundMatch ? `Matching grant` : `No matching grants found`,
  }
}
