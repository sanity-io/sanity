import {env} from 'node:process'

import {BlueskyStrategy, Client} from '@humanwhocodes/crosspost'
import {documentEventHandler} from '@sanity/functions'

const {BLUESKY_USERNAME = '', BLUESKY_PASSWORD = '', BLUESKY_HOST = 'bsky.social'} = env

interface NotificationData {
  slug: {
    current: string
  }
  blueskyPost: string
  title: string
}

export const handler = documentEventHandler<NotificationData>(async ({event}) => {
  const {data} = event
  const {title, blueskyPost, slug} = data

  try {
    const bluesky = new BlueskyStrategy({
      identifier: BLUESKY_USERNAME,
      password: BLUESKY_PASSWORD,
      host: BLUESKY_HOST,
    })
    const client = new Client({
      strategies: [bluesky],
    })

    const postContent = `${title}

${blueskyPost}

${slug.current}`

    await client.post(postContent)
    console.log('Successfully sent post to Bluesky')
  } catch (error) {
    console.error('Error posting to Bluesky:', error)
    throw error
  }
})
