import {
  actionsToMutations,
  commitTransaction,
  type ContentLakeAction,
  ContentLakeError,
  type DocumentIndex,
  type MutationPayload,
} from '@repo/content-lake-model'

export interface RecordedCall {
  method: string
  path: string
  body: unknown
}

type Override = (call: RecordedCall) => Response | undefined

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json'}})
}

/** A stand-in for the real Content Lake HTTP API, backed by the model, with its own revision ids. */
export function createFakeContentLakeServer(override: Override = () => undefined) {
  const calls: RecordedCall[] = []
  const state: {index: DocumentIndex; transactions: number} = {index: {}, transactions: 0}

  function commit(toMutations: () => MutationPayload[]): Response {
    try {
      state.transactions += 1
      const transactionId = `real-${state.transactions}`
      const committed = commitTransaction({
        index: state.index,
        mutations: toMutations(),
        transactionId,
        identity: 'server',
        timestamp: '2026-10-30T00:00:00.000Z',
      })
      state.index = committed.index
      return json(200, {transactionId, results: committed.results})
    } catch (error) {
      if (error instanceof ContentLakeError) return json(error.statusCode, {error: error.body})
      return json(400, {error: {type: 'mutationError', description: String(error)}})
    }
  }

  function answer(call: RecordedCall): Response {
    const [, , area, endpoint, , ids] = call.path.split('/')
    if (area === 'datasets') return json(200, {datasetName: endpoint})
    if (endpoint === 'query') return json(200, {result: 0})
    if (endpoint === 'doc') {
      const documents = decodeURIComponent(ids)
        .split(',')
        .flatMap((id) => (state.index[id] ? [state.index[id]] : []))
      return json(200, {documents})
    }
    const body = call.body as {mutations?: MutationPayload[]; actions?: ContentLakeAction[]}
    if (endpoint === 'actions') {
      return commit(() => actionsToMutations(state.index, body.actions ?? []))
    }
    return commit(() => body.mutations ?? [])
  }

  const fetchImplementation = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input)
    const call: RecordedCall = {
      method: init?.method ?? 'GET',
      path: url.pathname,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    }
    calls.push(call)
    return override(call) ?? answer(call)
  }

  return {calls, state, fetch: fetchImplementation as typeof fetch}
}
