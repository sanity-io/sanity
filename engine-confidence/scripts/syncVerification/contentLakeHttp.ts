import {type ContentLakeDocument} from '@repo/content-lake-model'

import {type SubmissionRequest} from './contracts'

/** The Studio commits actions and mutations on this version (`checkoutPair.ts`, `studioClient.ts`). */
const STUDIO_API_VERSION = 'v2025-02-19'

const INFRASTRUCTURE_RETRY_STATUSES = new Set([429, 502, 503, 504])
const DATASET_READINESS_RETRY_STATUSES = new Set([404, ...INFRASTRUCTURE_RETRY_STATUSES])
const SUBMISSION_RETRY_STATUSES = new Set([429])
const MAX_ATTEMPTS = 6
const BASE_DELAY_MS = 2_000
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000
const MAX_DELAY_MS = 60_000

export interface ContentLakeTarget {
  projectId: string
  dataset: string
  token: string
  apiHost: string
  rateLimitBypass?: string
  requestTimeoutMs?: number
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  log?: (message: string) => void
}

export interface HttpAnswer {
  status: number
  body: unknown
  retryAfter?: string | null
}

export interface ContentLakeHttp {
  dataset: string
  createDataset: () => Promise<void>
  deleteDataset: () => Promise<void>
  waitForDataset: () => Promise<void>
  submit: (request: SubmissionRequest) => Promise<HttpAnswer>
  seed: (documents: ContentLakeDocument[]) => Promise<string>
  deleteDocuments: (ids: string[]) => Promise<void>
  getDocuments: (ids: string[]) => Promise<Record<string, ContentLakeDocument | null>>
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseBody(text: string): unknown {
  if (text.length === 0) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function retryDelayMs(answer: HttpAnswer, attempt: number): number {
  const retryAfter = Number(answer.retryAfter)
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, MAX_DELAY_MS)
  }
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
}

function describeAnswer(label: string, answer: HttpAnswer): string {
  return `${label} failed with HTTP ${answer.status}: ${JSON.stringify(answer.body).slice(0, 300)}`
}

export function createContentLakeHttp(target: ContentLakeTarget): ContentLakeHttp {
  const fetchImplementation = target.fetch ?? fetch
  const sleep = target.sleep ?? defaultSleep
  const log = target.log ?? (() => undefined)
  const requestTimeoutMs = target.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  const projectBase = `https://${target.projectId}.${target.apiHost}/${STUDIO_API_VERSION}`
  const dataBase = `${projectBase}/data`
  const headers = {
    'Authorization': `Bearer ${target.token}`,
    'Content-Type': 'application/json',
    ...(target.rateLimitBypass ? {'x-sanity-ratelimit-bypass': target.rateLimitBypass} : {}),
  }

  async function request(method: string, url: string, body?: unknown): Promise<HttpAnswer> {
    try {
      const response = await fetchImplementation(url, {
        method,
        headers,
        signal: AbortSignal.timeout(requestTimeoutMs),
        ...(body === undefined ? {} : {body: JSON.stringify(body)}),
      })
      return {
        status: response.status,
        body: parseBody(await response.text()),
        retryAfter: response.headers.get('retry-after'),
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error(
          `${method} ${new URL(url).pathname} timed out after ${requestTimeoutMs}ms`,
          {cause: error},
        )
      }
      throw error
    }
  }

  async function requestWithRetry(
    label: string,
    retryStatuses: ReadonlySet<number>,
    send: () => Promise<HttpAnswer>,
    attempt = 0,
  ): Promise<HttpAnswer> {
    const answer = await send()
    if (retryStatuses.has(answer.status) && attempt + 1 < MAX_ATTEMPTS) {
      const delay = retryDelayMs(answer, attempt)
      log(`${label}: HTTP ${answer.status}, retrying in ${Math.round(delay / 1000)}s`)
      await sleep(delay)
      return requestWithRetry(label, retryStatuses, send, attempt + 1)
    }
    return answer
  }

  async function infrastructure(
    label: string,
    method: string,
    url: string,
    body?: unknown,
    retryStatuses: ReadonlySet<number> = INFRASTRUCTURE_RETRY_STATUSES,
  ): Promise<HttpAnswer> {
    const answer = await requestWithRetry(label, retryStatuses, () => request(method, url, body))
    if (answer.status >= 200 && answer.status < 300) return answer
    throw new Error(describeAnswer(label, answer))
  }

  function mutateUrl(): string {
    return `${dataBase}/mutate/${target.dataset}?visibility=sync&skipCrossDatasetReferenceValidation=true`
  }

  return {
    dataset: target.dataset,
    createDataset: async () => {
      await infrastructure(
        `Creating dataset ${target.dataset}`,
        'PUT',
        `${projectBase}/datasets/${target.dataset}?tag=sync-verify`,
        {aclMode: 'private'},
      )
    },
    deleteDataset: async () => {
      await infrastructure(
        `Deleting dataset ${target.dataset}`,
        'DELETE',
        `${projectBase}/datasets/${target.dataset}?tag=sync-verify`,
      )
    },
    waitForDataset: async () => {
      const query = encodeURIComponent('count(*[])')
      await infrastructure(
        `Waiting for dataset ${target.dataset}`,
        'GET',
        `${dataBase}/query/${target.dataset}?query=${query}&tag=sync-verify`,
        undefined,
        DATASET_READINESS_RETRY_STATUSES,
      )
    },
    submit: (submission) =>
      requestWithRetry('Replaying a submission', SUBMISSION_RETRY_STATUSES, () =>
        submission.kind === 'actions'
          ? request('POST', `${dataBase}/actions/${target.dataset}`, {
              actions: submission.actions,
            })
          : request('POST', mutateUrl(), {mutations: submission.mutations}),
      ),
    seed: async (documents) => {
      const answer = await infrastructure('Seeding documents', 'POST', mutateUrl(), {
        mutations: documents.map((document) => ({createOrReplace: document})),
      })
      return (answer.body as {transactionId: string}).transactionId
    },
    deleteDocuments: async (ids) => {
      if (ids.length === 0) return
      await infrastructure('Deleting documents', 'POST', mutateUrl(), {
        mutations: ids.map((id) => ({delete: {id}})),
      })
    },
    getDocuments: async (ids) => {
      const answer = await infrastructure(
        'Reading documents',
        'GET',
        `${dataBase}/doc/${target.dataset}/${ids.map(encodeURIComponent).join(',')}?tag=sync-verify`,
      )
      const found = (answer.body as {documents?: ContentLakeDocument[]}).documents ?? []
      const byId = new Map(found.map((document) => [document._id, document]))
      return Object.fromEntries(ids.map((id) => [id, byId.get(id) ?? null]))
    },
  }
}
