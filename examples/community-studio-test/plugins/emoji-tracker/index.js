import React, { useEffect, useState } from 'react'
import { Emoji } from 'emoji-mart'
import QueryContainer from 'part:@sanity/base/query-container'

import styles from './Emoji.css'
const [year, month, day] = new Date()
  .toISOString()
  .split('T')[0]
  .split('-')
const todayId = `slack-emojis-${day}-${month}-${year}`

// const query = `*[_id == "${todayId}"].summary[0]`
const query = `*[_type == "emojiTracker"][0...7]`
function EmojiTracker () {
  return (
    <div className={styles.container}>

        <QueryContainer query={query}>
          {({ result }) => {
            if (!result) {
              return <div>Loading...</div>
            }
            console.log(result)
            const { documents } = result
            return documents.map(doc => (
              <div className={styles.content}>
                <header className={styles.header}>
                  <h2 className={styles.title}>Community Mood: {new Date(doc.date).toLocaleDateString()}</h2>
                </header>
                <main className={styles.main}>
                {doc.summary.map(({ _key, colonCode, count }) => (
                  <Emoji key={_key} emoji={colonCode} size={24 * (count * 0.8)} />
                ))}
                </main>
                </div>
            ))
          }}
        </QueryContainer>
      <div className={styles.footer} />
    </div>
  )
}

export default {
  name: 'emojiTracker',
  component: EmojiTracker
}
