import {env} from 'node:process'

import {documentEventHandler} from '@sanity/functions'

const {TELEGRAM_BOT_TOKEN = '', TELEGRAM_CHAT_ID = '', STUDIO_URL = 'http://localhost:3333'} = env

export const handler = documentEventHandler(async ({event}) => {
  const {_id, comment} = event.data

  if (!comment) {
    // eslint-disable-next-line no-console
    console.log('No comment in event data')
    return
  } else if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    // eslint-disable-next-line no-console
    console.log('Environment variables not set')
    return
  }

  try {
    const message = `New comment received: ${comment}`
    const studioUrl = `${STUDIO_URL}/structure/comment;${_id}`

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        reply_markup: {
          inline_keyboard: [[{text: '📝 Open in Sanity Studio', url: studioUrl}]],
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    // eslint-disable-next-line no-console
    console.log('Message sent successfully:', result)
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    throw error
  }
})
