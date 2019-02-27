import React from 'react'
import sanityClient from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import styles from './index.css'
import Tutorial from './Tutorial'
import {get} from 'lodash'

const client = sanityClient({
  projectId: '3do82whm',
  dataset: 'production',
  useCdn: true
})

const builder = imageUrlBuilder(client)

const query = `
  *[_id == 'dashboardFeed-v1'] {
    items[]-> {
      _id,
      title,
      poster,
      youtubeURL,
      "presenter": authors[0]-> {name, mugshot, bio},
      guideOrTutorial-> {
        title,
        slug,
        "presenter": authors[0]-> {name, mugshot, bio}
      }
    }
  }[0]
`

function createReadUrl(slug) {
  return `https://www.sanity.io/guide/${slug}`
}

class SanityTutorials extends React.Component {
  state = {
    feedItems: []
  }

  componentDidMount() {
    client.fetch(query).then(response => {
      this.setState({
        feedItems: response.items
      })
    })
  }

  render() {
    const {feedItems} = this.state
    return (
      <>
        <h1 className={styles.title}>Guides & tutorials</h1>
        <ul className={styles.tutorials}>
          {feedItems.map(feedItem => {
            if (!feedItem.title) {
              return null
            }
            const presenter = feedItem.presenter || get(feedItem, 'guideOrTutorial.presenter') || {}
            return (
              <Tutorial
                key={feedItem._id}
                title={feedItem.title}
                videoURL={feedItem.youtubeURL}
                readURL={createReadUrl(get(feedItem, 'guideOrTutorial.slug.current'))}
                presenterName={presenter.name}
                presenterAvatar={builder
                  .image(presenter.mugshot)
                  .height(100)
                  .width(100)
                  .url()}
                presenterSubtitle={presenter.bio}
                posterURL={builder
                  .image(feedItem.poster)
                  .height(240)
                  .url()}
              />
            )
          })}
        </ul>
      </>
    )
  }
}

export default {
  name: 'sanity-tutorials',
  component: SanityTutorials
}
