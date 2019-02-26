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
  *[_id == 'studioDashboardDocument'] {
    _id,
    title,
    tutorials[] {
      title,
      poster,
      presentedBy->{
        name,
        mugshot
      },
      tutorialDocuments[]-> {
        _id,
        title,
        slug,
        url,
        author-> {
          name,
          mugshot
        }
      }
    }
  }[0]
`

class SanityTutorials extends React.Component {
  state = {
    tutorials: []
  }

  componentDidMount() {
    client.fetch(query).then(response => {
      this.setState({
        tutorials: response.tutorials
      })
    })
  }

  render() {
    const {tutorials} = this.state
    return (
      <>
        <h1 className={styles.title}>Tutorials & videos</h1>
        <ul className={styles.tutorials}>
          {tutorials.map(tutorial => {
            const primaryTutorialDocument =
              tutorial.tutorialDocuments && tutorial.tutorialDocuments.length > 0
                ? tutorial.tutorialDocuments[0]
                : null

            if (!primaryTutorialDocument) {
              return null
            }
            const author = primaryTutorialDocument.author ||
              tutorial.presentedBy || {
                name: 'Unknown',
                mugshot: null
              }
            const title = tutorial.title || primaryTutorialDocument.title

            return (
              <Tutorial
                key={primaryTutorialDocument._id}
                title={title}
                posterUrl={builder
                  .image(tutorial.poster)
                  .height(240)
                  .width(450)
                  .url()}
                authorName={author.name}
                avatarUrl={builder
                  .image(author.mugshot)
                  .height(100)
                  .width(100)
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
