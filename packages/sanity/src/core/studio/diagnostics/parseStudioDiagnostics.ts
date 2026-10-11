import {type StudioDiagnostics} from './gatherStudioDiagnostics'

/**
 * Parse and validate JSON copied from the studio diagnostics panel — the
 * counterpart to {@link gatherStudioDiagnostics} for viewers that receive the
 * report as pasted text (dev/studio-diagnostics-viewer, Studio Radar).
 *
 * @internal
 */
export function parseStudioDiagnostics(input: string): StudioDiagnostics {
  if (!input.trim()) throw new Error('Paste diagnostics JSON first.')

  let value: unknown
  try {
    value = JSON.parse(input)
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    throw new Error(`Could not parse diagnostics JSON: ${detail}`, {cause})
  }

  if (!isStudioDiagnostics(value)) {
    throw new Error('The JSON is not a supported Studio diagnostics report.')
  }

  return value
}

function isStudioDiagnostics(value: unknown): value is StudioDiagnostics {
  if (!isRecord(value) || value.diagnosticVersion !== 1) return false

  const {browser, network, schema, studio, styles, user} = value
  if (
    !isRecord(browser) ||
    !isRecord(network) ||
    !isRecord(schema) ||
    !isRecord(studio) ||
    !isRecord(user) ||
    typeof value.durationMs !== 'number' ||
    typeof value.generatedAt !== 'string' ||
    typeof value.startedAt !== 'string' ||
    (styles !== undefined && !isStylesDiagnostics(styles))
  ) {
    return false
  }

  const {listen, protocol, requestHistory, requests} = network
  if (
    !isRecord(listen) ||
    !isListenDiagnostic(listen.first) ||
    !isListenDiagnostic(listen.secondWhileFirstOpen) ||
    !isProtocolDiagnostic(protocol) ||
    !isRequestHistory(requestHistory) ||
    !Array.isArray(requests) ||
    !requests.every(isRequestDiagnostic)
  ) {
    return false
  }

  return (
    typeof schema.documentTypes === 'number' &&
    typeof schema.objectTypes === 'number' &&
    typeof schema.primitiveTypes === 'number' &&
    (studio.autoUpdates === undefined || typeof studio.autoUpdates === 'boolean') &&
    typeof studio.dataset === 'string' &&
    typeof studio.projectId === 'string' &&
    typeof studio.reactVersion === 'string' &&
    typeof studio.uniqueTargetCount === 'number' &&
    typeof studio.version === 'string' &&
    typeof studio.workspaceCount === 'number' &&
    Array.isArray(user.roles) &&
    user.roles.every(
      (role) => isRecord(role) && typeof role.name === 'string' && typeof role.title === 'string',
    )
  )
}

function isListenDiagnostic(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.durationMs === 'number' &&
    typeof value.path === 'string' &&
    isStatus(value.status) &&
    typeof value.timedOut === 'boolean'
  )
}

function isProtocolDiagnostic(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.durationMs === 'number' &&
    typeof value.protocol === 'string' &&
    (value.status === 'unsupported' || isStatus(value.status)) &&
    typeof value.timedOut === 'boolean'
  )
}

function isRequestDiagnostic(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.durationMs === 'number' &&
    typeof value.path === 'string' &&
    isStatus(value.status) &&
    typeof value.timedOut === 'boolean'
  )
}

function isRequestHistory(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !Array.isArray(value.entries) ||
    !value.entries.every(isRequestHistoryEntry) ||
    !isRecord(value.sessionSummary) ||
    !Array.isArray(value.sessionSummary.buckets) ||
    !value.sessionSummary.buckets.every(isBucketSummary)
  ) {
    return false
  }

  return (
    typeof value.maxEntries === 'number' &&
    typeof value.sessionSummary.startedAt === 'string' &&
    typeof value.sessionSummary.totalRequests === 'number' &&
    typeof value.totalRequests === 'number'
  )
}

function isRequestHistoryEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.apiVersion === 'string' &&
    typeof value.bucket === 'string' &&
    typeof value.dataset === 'string' &&
    typeof value.durationMs === 'number' &&
    typeof value.projectId === 'string' &&
    typeof value.startedAt === 'string' &&
    (isStatus(value.status) || value.status === 'aborted')
  )
}

function isBucketSummary(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.bucket === 'string' &&
    typeof value.count === 'number' &&
    typeof value.maxMs === 'number' &&
    typeof value.medianMs === 'number' &&
    typeof value.p95Ms === 'number'
  )
}

function isStylesDiagnostics(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.styledComponents)) return false

  return value.styledComponents.every(
    (node) =>
      isRecord(node) &&
      typeof node.ruleCount === 'number' &&
      (node.sizeBytes === undefined || typeof node.sizeBytes === 'number') &&
      (node.version === undefined || typeof node.version === 'string'),
  )
}

function isStatus(value: unknown): value is 'success' | 'timeout' | 'error' {
  return value === 'success' || value === 'timeout' || value === 'error'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
