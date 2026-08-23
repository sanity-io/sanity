import {env} from 'node:process'

import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

import {createWriteClient, publishXPost, type PublishResult, type WriteAction} from './publish'

type EventData = {
  _id: string
  _rev: string
  imageUrl?: string
  xPost: string
}

type StoredStatus = {
  message?: string
  state: string
  updatedAt: string
  url?: string
  writeActionId: string
}

const {X_TWITTER_SCRAPER_API_KEY, XQUIK_ACCOUNT} = env

function createStoredStatus(action: WriteAction, result?: PublishResult): StoredStatus {
  return {
    message: action.message,
    state: action.status,
    updatedAt: new Date().toISOString(),
    url: result?.url,
    writeActionId: action.id,
  }
}

export const handler = documentEventHandler<EventData>(async ({context, event}) => {
  if (!X_TWITTER_SCRAPER_API_KEY || !XQUIK_ACCOUNT) {
    throw new Error('X_TWITTER_SCRAPER_API_KEY and XQUIK_ACCOUNT must be set.')
  }

  const {_id, _rev, imageUrl, xPost} = event.data
  const signal = AbortSignal.timeout(50_000)
  let latestAction: WriteAction | undefined
  const sanityClient = context.local
    ? undefined
    : createClient({
        ...context.clientOptions,
        apiVersion: '2026-08-01',
        useCdn: false,
      })

  try {
    const result = await publishXPost({
      account: XQUIK_ACCOUNT,
      client: createWriteClient(X_TWITTER_SCRAPER_API_KEY),
      documentId: _id,
      imageUrl,
      onAction: (action) => {
        latestAction = action
      },
      revision: _rev,
      signal,
      text: xPost,
    })

    if (sanityClient) {
      await sanityClient
        .patch(_id)
        .set({xPostStatus: createStoredStatus(result.action, result)})
        .commit()
    }

    console.log(`Posted to X: ${result.url}`)
  } catch (error) {
    if (sanityClient && latestAction) {
      try {
        await sanityClient
          .patch(_id)
          .set({xPostStatus: createStoredStatus(latestAction)})
          .commit()
      } catch (statusError) {
        const statusMessage = statusError instanceof Error ? statusError.message : 'Unknown error'
        console.error(`Failed to store X post status: ${statusMessage}`)
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to post to X: ${message}`)
    throw error
  }
})
