import {type SubmissionComparison} from './compare'
import {type SubmissionRequest} from './generatorReport'

const ACTION_TYPE_PREFIX = 'sanity.action.'
const EMPTY_ACTION_GUARD_FIELD = '_empty_action_guard_pseudo_field_'
const PATCH_SETTINGS = new Set(['id', 'ifRevisionID', 'unsetIsEmpty', 'query'])
const IDENTITY_FIELDS = new Set(['_id', '_type'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// The form path adds this unset to every edit, so counting it would split one gap by seam.
function isEmptyActionGuard(operation: string, value: unknown): boolean {
  return (
    operation === 'unset' &&
    Array.isArray(value) &&
    value.every((path) => path === EMPTY_ACTION_GUARD_FIELD)
  )
}

function patchOperations(patch: unknown): string[] {
  if (!isRecord(patch)) return []
  return Object.entries(patch)
    .filter(([operation]) => !PATCH_SETTINGS.has(operation))
    .filter(([operation, value]) => !isEmptyActionGuard(operation, value))
    .map(([operation]) => operation)
}

function qualified(kind: string, operations: string[]): string[] {
  return operations.length === 0 ? [kind] : operations.map((operation) => `${kind}:${operation}`)
}

function actionOperations(action: unknown): string[] {
  if (!isRecord(action)) return ['unknown']
  const actionType =
    typeof action.actionType === 'string'
      ? action.actionType.replace(ACTION_TYPE_PREFIX, '')
      : 'unknown'
  return qualified(actionType, patchOperations(action.patch))
}

function mutationOperations(mutation: unknown): string[] {
  if (!isRecord(mutation)) return ['unknown']
  return Object.entries(mutation).flatMap(([kind, body]) =>
    kind === 'patch' ? qualified(kind, patchOperations(body)) : [kind],
  )
}

export function requestOperations(request: SubmissionRequest): string {
  const operations =
    request.kind === 'actions'
      ? request.actions.flatMap(actionOperations)
      : request.mutations.flatMap(mutationOperations)
  const unique = [...new Set(operations)]
  const qualifiedKinds = new Set(
    unique
      .filter((operation) => operation.includes(':'))
      .map((operation) => operation.split(':')[0]),
  )
  const named = unique.filter((operation) => !qualifiedKinds.has(operation))
  return named.toSorted().join(',') || 'none'
}

/** Outside writes and live edits both go to the mutate endpoint, so one gap gets one kind. */
function endpointKind(request: SubmissionRequest): 'actions' | 'mutations' {
  return request.kind === 'actions' ? 'actions' : 'mutations'
}

function differingFields(
  fake: Record<string, unknown> | null,
  real: Record<string, unknown> | null,
): string[] {
  if (fake === null) return ['only-real']
  if (real === null) return ['only-fake']
  const fields = [...new Set([...Object.keys(fake), ...Object.keys(real)])]
  return fields.filter(
    (field) =>
      !IDENTITY_FIELDS.has(field) && JSON.stringify(fake[field]) !== JSON.stringify(real[field]),
  )
}

function documentGap(comparison: SubmissionComparison): string {
  const documentIds = [
    ...new Set([
      ...Object.keys(comparison.fakeDocuments),
      ...Object.keys(comparison.realDocuments),
    ]),
  ]
  const fields = documentIds.flatMap((documentId) =>
    differingFields(
      comparison.fakeDocuments[documentId] ?? null,
      comparison.realDocuments[documentId] ?? null,
    ),
  )
  return `document:${[...new Set(fields)].toSorted().join(',')}`
}

function gapOf(comparison: SubmissionComparison): string {
  const {fake, real} = comparison
  const outcomeDiffers = fake.statusCode !== real.statusCode || fake.errorType !== real.errorType
  if (outcomeDiffers) return real.errorType ?? fake.errorType ?? 'none'
  return documentGap(comparison)
}

/**
 * Names the first submission the real server answered differently, from structured fields only,
 * so the same gap gets the same signature whatever ids, revisions or values the sequence used.
 */
export function fakeSignatureOf(
  submissions: ReadonlyArray<{request: SubmissionRequest}>,
  comparison: SubmissionComparison,
): string {
  const {request} = submissions[comparison.submission]
  return [
    'fake-mismatch',
    endpointKind(request),
    requestOperations(request),
    `${comparison.fake.statusCode}->${comparison.real.statusCode}`,
    gapOf(comparison),
  ].join(' | ')
}
