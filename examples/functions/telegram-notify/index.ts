import {env} from 'node:process'

import {documentEventHandler} from '@sanity/functions'

const {TELEGRAM_BOT_TOKEN = '', TELEGRAM_CHAT_ID = '', STUDIO_URL = 'http://localhost:3333'} = env

export const handler = documentEventHandler(async ({event}) => {
  const {_id, comment} = event.data

  if (!comment) {
    console.log('No comment in event data')
    return
  } else if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Environment variables not set')
    return
  }

  try {
    const message = `New comment received: ${comment}`
    const studioUrl = `${STUDIO_URL}/structure/comment;${_id}`

    // Build payload - conditionally include inline keyboard for non-localhost URLs
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    }

    // Telegram doesn't allow 'localhost' in the URL, so we include it in the message text instead
    if (STUDIO_URL.includes('localhost')) {
      payload.text += `\n\n📝 Open in Sanity Studio: ${studioUrl}`
    } else {
      payload.reply_markup = {
        inline_keyboard: [[{text: '📝 Open in Sanity Studio', url: studioUrl}]],
      }
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Message sent successfully:', result)
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    throw error
  }
})
