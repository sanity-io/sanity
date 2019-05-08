import React from 'react'
import PropTypes from 'prop-types'
import {get} from 'lodash'
import {distanceInWords} from 'date-fns'
import Tutorial from './Tutorial'
import styles from './SanityTutorials.css'
import dataAdapter from './dataAdapter'

const {urlBuilder, getFeed} = dataAdapter

function createUrl(slug, type) {
  if (type === 'tutorial') {
    return `https://www.sanity.io/docs/tutorials/${slug.current}`
  } else if (type === 'guide') {
    return `https://www.sanity.io/docs/guides/${slug.current}`
  }
  return false
}

class SanityTutorials extends React.Component {
  static propTypes = {
    templateRepoId: PropTypes.string
  }

  static defaultProps = {
    templateRepoId: null
  }

  state = {
    feedItems: []
  }

  componentDidMount() {
    const {templateRepoId} = this.props
    getFeed(templateRepoId).then(response => {
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
            if (!feedItem.title || (!feedItem.guideOrTutorial && !feedItem.externalLink)) {
              return null
            }
            const presenter = feedItem.presenter || get(feedItem, 'guideOrTutorial.presenter') || {}
            const date = get(feedItem, 'guideOrTutorial._createdAt')
            const {guideOrTutorial = {}} = feedItem
            return (
              <li key={feedItem._id}>
                <Tutorial
                  title={feedItem.title}
                  href={
                    createUrl(guideOrTutorial.slug, guideOrTutorial._type) || feedItem.externalLink
                  }
                  presenterName={presenter.name}
                  presenterSubtitle={`${distanceInWords(new Date(date), new Date())} ago`}
                  showPlayIcon={feedItem.hasVideo}
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
