import {type ProxyRequest, type ProxyResponse} from '@repo/debug-proxy'
import {evaluate, parse} from 'groq-js'

import {BENCH_USER} from '../constants'
import {json, readBody} from './respond'
import {type ListenHub} from './sse'
import {type DocumentStore, newTransactionId} from './store'
import {type BenchAction, type BenchDocument, type MutationPayload} from './types'

/**
 * GET /data/doc/<ds>/<id1>,<id2>,… — the initial snapshot fetch the pair
 * listener performs on `welcome` (getPairListener.ts). @sanity/client maps
 * the returned documents back to the requested ids itself, so order and
 * missing documents don't matter here.
 */
export function handleDoc(
  req: ProxyRequest,
  res: ProxyResponse,
  store: DocumentStore,
  idsSegment: string,
): number {
  const ids = decodeURIComponent(idsSegment).split(',')
  const documents = ids
    .map((id) => store.get(id))
    .filter((doc): doc is BenchDocument => doc !== null)
  return json(req, res, 200, {documents, omitted: []})
}

/**
 * GET /data/history/<ds>/documents/<id>?revision=<rev> — the document at a
 * past revision, used by the divergence/changes machinery
 * (getDocumentAtRevision.ts) which reads `response.documents[0]`. The soak
 * session triggers it after enough edits accumulate; without a handler the
 * studio logs a console error per call and the session fails (mock-drift
 * detector). The mock keeps no per-revision snapshots, so return the current
 * document — the shape is what matters here, not historical diff fidelity.
 */
export function handleDocRevision(
  req: ProxyRequest,
  res: ProxyResponse,
  store: DocumentStore,
  idSegment: string,
): number {
  const doc = store.get(decodeURIComponent(idSegment))
  return json(req, res, 200, {documents: doc ? [doc] : []})
}

/** GET|POST /data/query/<ds> — GROQ over the in-memory store via groq-js. */
export async function handleQuery(
  req: ProxyRequest,
  res: ProxyResponse,
  store: DocumentStore,
  url: URL,
): Promise<number> {
  let query: string | null
  let params: Record<string, unknown> = {}

  if (req.method === 'POST') {
    const body = JSON.parse((await readBody(req)).toString('utf8')) as {
      query: string
      params?: Record<string, unknown>
    }
    query = body.query
    params = body.params ?? {}
  } else {
    query = url.searchParams.get('query')
    for (const [key, value] of url.searchParams) {
      if (key.startsWith('$')) {
        params[key.slice(1)] = JSON.parse(value)
      }
    }
  }

  if (!query) {
    return json(req, res, 400, {error: {description: 'Missing query'}})
  }

  const started = Date.now()
  try {
    const tree = parseWithParams(rewriteUnsupportedGroq(query), params)
    const result = await (
      await evaluate(tree, {dataset: store.getAll(), params, identity: BENCH_USER.id})
    ).get()
    return json(req, res, 200, {ms: Date.now() - started, query, result: result ?? null})
  } catch (error) {
    return json(req, res, 400, {
      error: {
        type: 'queryParseError',
        description: error instanceof Error ? error.message : String(error),
      },
    })
  }
}

/**
 * The structure tool's list/search query (findability) filters with
 * `text::query()`, a Text-Search-API function groq-js cannot evaluate.
 * Bench scenarios never search, so rewrite that predicate to match-all —
 * the document list renders its full content, which is what the real API
 * returns for an empty search. If the studio's query shape changes, the
 * rewrite stops matching and the resulting 400 shows up as console noise
 * (mock-drift visibility) rather than silently wrong results.
 */
function rewriteUnsupportedGroq(query: string): string {
  return query.replace(/\[@,\s*_id\]\s+match\s+text::query\(\$__query\)/g, 'true')
}

/**
 * groq-js requires slice bounds to be constants, but studio queries slice
 * with params (`[0...$__limit]` in the structure list query). Content Lake
 * accepts those, so when the strict parse fails on slicing, retry with every
 * `$param` reference textually replaced by its JSON literal (valid GROQ for
 * any JSON value).
 */
function parseWithParams(query: string, params: Record<string, unknown>) {
  try {
    return parse(query)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('slicing')) {
      throw error
    }
    const substituted = query.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, name) =>
      name in params ? JSON.stringify(params[name]) : match,
    )
    return parse(substituted)
  }
}

/**
 * POST /data/mutate/<ds> — the raw mutation path (live-edit documents and
 * fixture seeding). Response shape mirrors what `dataRequest('mutate', …,
 * {returnDocuments: false})` expects.
 */
export async function handleMutate(
  req: ProxyRequest,
  res: ProxyResponse,
  store: DocumentStore,
  hub: ListenHub,
): Promise<number> {
  const body = JSON.parse((await readBody(req)).toString('utf8')) as {
    mutations: MutationPayload[]
    transactionId?: string
  }
  const {transactionId, events, results} = store.commit(
    body.mutations,
    body.transactionId ?? newTransactionId(),
  )
  const bytes = json(req, res, 200, {transactionId, results})
  hub.broadcast(events)
  return bytes
}

function actionToMutations(action: BenchAction, store: DocumentStore): MutationPayload[] {
  switch (action.actionType) {
    case 'sanity.action.document.create': {
      if (action.ifExists === 'fail' && store.get(action.attributes._id)) {
        throw new ActionError(409, `Document "${action.attributes._id}" already exists`)
      }
      return [{createIfNotExists: action.attributes}]
    }
    case 'sanity.action.document.edit': {
      const mutations: MutationPayload[] = []
      if (!store.get(action.draftId)) {
        // Content Lake materializes the draft from the published document
        // (or a bare stub) before applying the edit patch.
        const published = store.get(action.publishedId)
        const base: BenchDocument = published
          ? {...structuredClone(published), _id: action.draftId}
          : {_id: action.draftId, _type: inferTypeFromPatch(action)}
        mutations.push({createIfNotExists: base})
      }
      mutations.push({patch: {id: action.draftId, ...action.patch}})
      return mutations
    }
    default: {
      // Fail loudly: an unsupported action reaching the mock means the studio
      // grew a new write path the mock must learn about (mock-drift policy).
      throw new ActionError(
        400,
        `Unsupported action type: ${(action as {actionType: string}).actionType}`,
      )
    }
  }
}

function inferTypeFromPatch(
  action: Extract<BenchAction, {actionType: 'sanity.action.document.edit'}>,
): string {
  // An edit creating a brand-new draft (no published doc) carries the type in
  // its `set` patch when the form initializes the document; fall back to a
  // marker type that will fail readback validation loudly rather than
  // silently succeeding with wrong data.
  const set = action.patch.set as Record<string, unknown> | undefined
  return typeof set?._type === 'string' ? set._type : 'bench.unknown'
}

class ActionError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ActionError'
  }
}

/**
 * POST /data/actions/<ds> — the studio's primary write path
 * (checkoutPair.ts commitActions). The response `transactionId` MUST equal
 * the one submitted: the studio matches its own echoes by transaction id
 * (@sanity/mutator Document.consumeUnresolved), and Content Lake sets
 * `resultRev = transactionId`, which the mock replicates.
 */
export async function handleActions(
  req: ProxyRequest,
  res: ProxyResponse,
  store: DocumentStore,
  hub: ListenHub,
): Promise<number> {
  const body = JSON.parse((await readBody(req)).toString('utf8')) as {
    actions: BenchAction[]
    transactionId?: string
    dryRun?: boolean
  }

  let mutations: MutationPayload[]
  try {
    mutations = body.actions.flatMap((action) => actionToMutations(action, store))
  } catch (error) {
    if (error instanceof ActionError) {
      return json(req, res, error.statusCode, {
        error: {description: error.message, type: 'actionError'},
      })
    }
    throw error
  }

  if (body.dryRun) {
    return json(req, res, 200, {transactionId: body.transactionId ?? newTransactionId()})
  }

  const {transactionId, events} = store.commit(mutations, body.transactionId ?? newTransactionId())
  const bytes = json(req, res, 200, {transactionId})
  hub.broadcast(events)
  return bytes
}
