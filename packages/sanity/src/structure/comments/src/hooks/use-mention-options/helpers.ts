import {SanityDocument} from '@sanity/client'
import {evaluate, parse} from 'groq-js'
import {MentionOptionUser} from '../../types'
import {EvaluationParams, Grant, DocumentValuePermission, PermissionCheckResult} from 'sanity'

// TODO:
// This code is copied from the `grantsStore.ts` and slightly modified to work with the `MentionOptionUser` type.
// TODO: Refactor this to be a shared function between the `grantsStore.ts` and this file.

function getParams(user: MentionOptionUser | null): EvaluationParams {
  const params: EvaluationParams = {}

  if (user !== null) {
    params.identity = user.id
  }

  return params
}

const PARSED_FILTERS_MEMO = new Map()
async function matchesFilter(
  user: MentionOptionUser | null,
  filter: string,
  document: SanityDocument,
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

  const evalParams = getParams(user)
  const {identity} = evalParams
  const params: Record<string, unknown> = {...evalParams}
  const data = await (await evaluate(parsed, {dataset: [document], identity, params})).get()
  return data?.length === 1
}

export async function grantsPermissionOn(
  user: MentionOptionUser | null,
  grants: Grant[],
  permission: DocumentValuePermission,
  document: SanityDocument | null,
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
    if (await matchesFilter(user, grant.filter, document)) {
      matchingGrants.push(grant)
    }
  }

  const foundMatch = matchingGrants.some((grant) => grant.permissions.some((p) => p === permission))

  return {
    granted: foundMatch,
    reason: foundMatch ? `Matching grant` : `No matching grants found`,
  }
}
