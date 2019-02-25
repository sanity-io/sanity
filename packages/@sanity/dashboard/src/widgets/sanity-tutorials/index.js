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
    title,
    tutorials[] {
      title,
      poster,
      durationText,
      author-> {
        name,
        mugshot
      },
      tutorial-> {
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
    title: 'Welcome to sanity',
    tutorials: []
  }

  componentDidMount() {
    client.fetch(query).then(res => {
      this.setState({
        title: res.title,
        tutorials: res.tutorials
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
            const author = tutorial.author ||
              (tutorial.tutorial && tutorial.tutorial.author) || {
                name: 'Unknown',
                mugshot: undefined
              }
            return (
              <Tutorial
                key={tutorial._id}
                title={tutorial.title}
                posterUrl={builder
                  .image(tutorial.poster)
                  .height(240)
                  .width(450)}
                authorName={author.name}
                durationText={tutorial.durationText}
                avatarUrl={builder
                  .image(author.mugshot)
                  .height(100)
                  .width(100)}
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
