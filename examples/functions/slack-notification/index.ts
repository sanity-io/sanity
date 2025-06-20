import {type DocumentEvent, documentEventHandler, type FunctionContext} from '@sanity/functions'
import {WebClient} from '@slack/web-api'

export const handler = documentEventHandler(
  async ({context, event}: {context: FunctionContext; event: DocumentEvent}) => {
    // eslint-disable-next-line no-console
    console.log('Event data:', JSON.stringify(event.data, null, 2))

    // Initialize Slack client
    const slack = new WebClient(process.env.SLACK_OAUTH_TOKEN)

    try {
      // Send message to Slack
      await slack.chat.postMessage({
        channel: 'kens-test-channel',
        text: `*New Document Published!*\nTitle: ${event.data.title || 'Untitled'}\nWebpage: <http://localhost:3000/posts/${event.data.slug?.current || 'no-slug'}|Click Here>\nStudio: <http://localhost:3333/structure/post;${event.data._id}|Click Here>\nDateTime Published: ${new Date(event.data._updatedAt).toLocaleString()}`,
      })

      // eslint-disable-next-line no-console
      console.log('Slack notification sent successfully')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending Slack notification:', error)
      throw error
    }
  },
)
