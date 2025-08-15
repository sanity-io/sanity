import {env} from 'node:process'

import {Client, MastodonStrategy} from '@humanwhocodes/crosspost'
import {documentEventHandler} from '@sanity/functions'

const {MASTODON_TOKEN = '', MASTODON_HOST = ''} = env

interface NotificationData {
  slug: {
    current: string
  }
  mastodonPost: string
  title: string
}

export const handler = documentEventHandler<NotificationData>(async ({event}) => {
  const {data} = event
  const {title, mastodonPost, slug} = data

  try {
    const mastodon = new MastodonStrategy({
      accessToken: MASTODON_TOKEN,
      host: MASTODON_HOST,
    })
    const client = new Client({
      strategies: [mastodon],
    })

    const postContent = `${title}

${mastodonPost}

${slug.current}`

    await client.post(postContent)
    console.log('Successfully sent post to Mastodon')
  } catch (error) {
    console.error('Error posting to Mastodon:', error)
    throw error
  }
})
