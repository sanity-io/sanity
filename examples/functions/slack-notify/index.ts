import {env} from 'node:process'

import {documentEventHandler} from '@sanity/functions'
import {WebClient} from '@slack/web-api'

const {
  SLACK_OAUTH_TOKEN = '',
  SLACK_CHANNEL = '',
  BASE_URL = 'http://localhost:3000',
  STUDIO_URL = 'http://localhost:3333',
} = env

export const handler = documentEventHandler(async ({event}) => {
  // Initialize Slack client
  const slack = new WebClient(SLACK_OAUTH_TOKEN)

  try {
    // Prepare message content
    const message = `*New Document Created!*\nTitle: ${event.data.title || 'Untitled'}\nWebpage: <${BASE_URL}/posts/${event.data.slug?.current || 'no-slug'}|Click Here>\nStudio: <${STUDIO_URL}/structure/post;${event.data._id}|Click Here>\nDateTime Created: ${new Date(event.data._createdAt).toLocaleString()}`

    // Send message to Slack
    await slack.chat.postMessage({
      channel: SLACK_CHANNEL,
      text: message,
    })

    console.log(
      'Slack notification sent successfully to channel:',
      SLACK_CHANNEL,
      'Message sent:',
      message,
    )
  } catch (error) {
    console.error('Error sending Slack notification:', error)
    throw error
  }
})
