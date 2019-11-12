import React from 'react'
import PropTypes from 'prop-types'
import SanityClient from '@sanity/client'
import ArrowRight from 'part:@sanity/base/arrow-right'
import styles from './HintsPackage.css'
import HintCard from './HintCard'

const docsStudioSanityClient = new SanityClient({
  projectId: '3do82whm',
  dataset: 'next',
  useCdn: false // switch this to true when we're out of dev mode
})

class HintsPackage extends React.PureComponent {
  static props = {
    slug: PropTypes.string.isRequired
  }

  state = {
    error: null,
    hintsPackage: null
  }

  fetchHintsPackage(slug) {
    docsStudioSanityClient
      .fetch(
        '*[_type == "hintsPackage" && slug.current == $slug][0]{_id, title, slug, links, hintsTitle, hints[]->{_id, title, summary, body}}',
        {slug}
      )
      .then(hintsPackage => {
        this.setState({hintsPackage})
      })
      .catch(error => this.setState({error}))
  }

  componentDidMount() {
    this.fetchHintsPackage(this.props.slug)
  }

  render() {
    const {hintsPackage, error} = this.state

    const hints = hintsPackage && hintsPackage.hints
    const links = hintsPackage && hintsPackage.links
    console.log(hintsPackage)
    if (error) {
      return (
        <div>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )
    }
    if (!hintsPackage) {
      return null
    }
    return (
      <div className={styles.root}>
        <div className={styles.linksWrapper}>
          {links.map(link => {
            return (
              <h3 className={styles.linkHeading} key={link.title}>
                <a
                  className={styles.link}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.title}
                  <span className={styles.linkIcon}>
                    <ArrowRight />
                  </span>
                </a>
              </h3>
            )
          })}
        </div>
        <div className={styles.hintsWrapper}>
          <h2 className={styles.hintsListHeading}>{hintsPackage.hintsTitle}</h2>
          {hints.map(hint => {
            return <HintCard key={hint._id} title={hint.title} summary={hint.summary} />
          })}
        </div>
      </div>
    )
  }
}

export default HintsPackage
