import React from 'react'
import {get} from 'lodash'
import {distanceInWords} from 'date-fns'
import Tutorial from './Tutorial'
import styles from './SanityTutorials.css'
import dataAdapter from './dataAdapter'

const {urlBuilder, getFeed} = dataAdapter

function createUrl(slug) {
  return `https://www.sanity.io/docs/guides/${slug.current}`
}

class SanityTutorials extends React.Component {
  state = {
    feedItems: []
  }

  componentDidMount() {
    getFeed().then(response => {
      this.setState({
        feedItems: response.items
      })
    })
  }

  render() {
    const {feedItems} = this.state
    const title = 'Learn about Sanity'
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
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
                  href={createUrl(get(feedItem, 'guideOrTutorial.slug'))}
                  presenterName={presenter.name}
                  presenterSubtitle={`${distanceInWords(new Date(date), new Date())} ago`}
                  posterURL={urlBuilder
                    .image(feedItem.poster)
                    .height(360)
                    .url()}
                />
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}

export default SanityTutorials
