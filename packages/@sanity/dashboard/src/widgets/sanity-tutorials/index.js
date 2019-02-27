import React from 'react'
import sanityClient from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import styles from './index.css'
import Tutorial from './Tutorial'

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
      guideOrTutorial {
        title,
        presentedBy->{
          name,
          mugshot
        },
      },
      authors[]->
    }
  }[0]
`

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
        <h1 className={styles.title}>Tutorials & videos</h1>
        <ul className={styles.tutorials}>
          {feedItems.map(feedItem => {
            return (
              <Tutorial
                key={feedItem._id}
                title={feedItem.title}
                posterUrl={builder
                  .image(feedItem.poster)
                  .height(240)
                  .url()}
                presenters={feedItem.title}
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
