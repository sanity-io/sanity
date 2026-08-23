import {createHash} from 'node:crypto'
import {setTimeout as delay} from 'node:timers/promises'

import XTwitterScraper from 'x-twitter-scraper'

export type WriteAction = {
  id: string
  message?: string
  pollAfterMs: number | null
  result: {id?: string} | null
  status: string
  success: boolean
  terminal: boolean
  tweetId?: string
}

type CreateTweetInput = {
  'account': string
  'Idempotency-Key': string
  'media'?: string[]
  'text': string
}

export type WriteClient = {
  createTweet: (input: CreateTweetInput, signal?: AbortSignal) => Promise<WriteAction>
  getWriteAction: (id: string, signal?: AbortSignal) => Promise<WriteAction>
}

type Sleep = (milliseconds: number, signal?: AbortSignal) => Promise<void>

type PublishInput = {
  account: string
  client: WriteClient
  documentId: string
  imageUrl?: string
  onAction?: (action: WriteAction) => void
  revision: string
  signal?: AbortSignal
  sleep?: Sleep
  text: string
}

export type PublishResult = {
  action: WriteAction
  url: string
}

const MAX_POLL_ATTEMPTS = 20
const DEFAULT_POLL_DELAY_MS = 2_000

const defaultSleep: Sleep = async (milliseconds, signal) => {
  await delay(milliseconds, undefined, {signal})
}

export function createWriteClient(apiKey: string): WriteClient {
  const client = new XTwitterScraper({apiKey})

  return {
    createTweet: async (input, signal) => client.x.tweets.create(input, {signal}),
    getWriteAction: async (id, signal) => client.x.writeActions.retrieve(id, {signal}),
  }
}

export function buildIdempotencyKey(input: {
  account: string
  documentId: string
  imageUrl?: string
  revision: string
  text: string
}): string {
  const digest = createHash('sha256')
    .update(
      JSON.stringify([
        input.account,
        input.documentId,
        input.revision,
        input.text,
        input.imageUrl ?? null,
      ]),
    )
    .digest('hex')

  return `sanity-x-post-${digest}`
}

function validateImageUrl(imageUrl: string | undefined): string[] | undefined {
  if (!imageUrl) {
    return undefined
  }

  const url = new URL(imageUrl)
  if (url.protocol !== 'https:') {
    throw new Error('The X post image must use HTTPS.')
  }

  return [url.toString()]
}

function getTweetUrl(action: WriteAction): string {
  const tweetId = action.result?.id ?? action.tweetId
  if (!tweetId) {
    throw new Error('X confirmed the post but did not return its ID.')
  }

  return `https://x.com/i/web/status/${tweetId}`
}

function assertSuccessful(action: WriteAction): void {
  if (!action.success) {
    throw new Error(action.message || `X post ended with status ${action.status}.`)
  }
}

export async function publishXPost(input: PublishInput): Promise<PublishResult> {
  if (!input.text.trim()) {
    throw new Error('The X post text is empty.')
  }

  const media = validateImageUrl(input.imageUrl)
  const idempotencyKey = buildIdempotencyKey(input)
  let action = await input.client.createTweet(
    {
      'account': input.account,
      'Idempotency-Key': idempotencyKey,
      media,
      'text': input.text,
    },
    input.signal,
  )
  input.onAction?.(action)

  const sleep = input.sleep ?? defaultSleep
  for (let attempt = 0; !action.terminal && attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(action.pollAfterMs ?? DEFAULT_POLL_DELAY_MS, input.signal)
    action = await input.client.getWriteAction(action.id, input.signal)
    input.onAction?.(action)
  }

  if (!action.terminal) {
    throw new Error(`X post ${action.id} is still pending. Check its write action status.`)
  }

  assertSuccessful(action)
  return {action, url: getTweetUrl(action)}
}
