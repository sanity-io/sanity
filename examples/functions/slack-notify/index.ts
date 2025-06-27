import {type DocumentEvent, documentEventHandler, type FunctionContext} from '@sanity/functions'
import {WebClient} from '@slack/web-api'

export const handler = documentEventHandler(
  async ({context, event}: {context: FunctionContext; event: DocumentEvent}) => {
    // Configuration constants
    const baseUrl = 'http://localhost:3000'
    const studioUrl = 'http://localhost:3333'
    const slackChannel = 'kens-test-channel'

    // eslint-disable-next-line no-console
    console.log('Event data:', JSON.stringify(event.data, null, 2))

    // Initialize Slack client
    const slack = new WebClient(process.env.SLACK_OAUTH_TOKEN)

    try {
      // Prepare message content
      const message = `*New Document Published!*\nTitle: ${event.data.title || 'Untitled'}\nWebpage: <${baseUrl}/posts/${event.data.slug?.current || 'no-slug'}|Click Here>\nStudio: <${studioUrl}/structure/post;${event.data._id}|Click Here>\nDateTime Published: ${new Date(event.data._updatedAt).toLocaleString()}`

      // Send message to Slack
      await slack.chat.postMessage({
        channel: slackChannel,
        text: message,
      })

      // eslint-disable-next-line no-console
      console.log('Slack notification sent successfully to channel:', slackChannel)
      // eslint-disable-next-line no-console
      console.log('Message sent:', message)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending Slack notification:', error)
      throw error
    }
  },
)
