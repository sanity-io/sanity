import React from 'react'
import {get} from 'lodash'
import {distanceInWords} from 'date-fns'
import Tutorial from './Tutorial'
import styles from './SanityTutorials.css'
import dataAdapter from './dataAdapter'

const {urlBuilder, getFeed} = dataAdapter

function createUrl(slug) {
  return `https://www.sanity.io/guide/${slug.current}`
}

class SanityTutorials extends React.Component {
  state = {
    feedItems: []
  }

  componentDidMount() {
    this.unsubscribe()
    this.subscription = getFeed().subscribe(response => {
      this.setState({
        feedItems: response.items
      })
    })
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  render() {
    const {feedItems} = this.state
    return (
      <>
        <header className={styles.header}>
          <h1 className={styles.title}>Guides & tutorials</h1>
        </header>
        <ul className={styles.grid}>
          {feedItems.map(feedItem => {
            if (!feedItem.title) {
              return null
            }
            const presenter = feedItem.presenter || get(feedItem, 'guideOrTutorial.presenter') || {}
            const date = get(feedItem, 'guideOrTutorial._createdAt')
            return (
              <li key={feedItem._id}>
                <Tutorial
                  title={feedItem.title}
                  hasVideo={!!feedItem.youtubeURL}
                  href={createUrl(get(feedItem, 'guideOrTutorial.slug'))}
                  presenterName={presenter.name}
                  presenterSubtitle={`${distanceInWords(new Date(date), new Date())} ago`}
                  posterURL={urlBuilder
                    .image(feedItem.poster)
                    .height(240)
                    .url()}
                />
              </li>
            )
          })}
        </ul>
      </>
    )
  }
}

export default SanityTutorials
