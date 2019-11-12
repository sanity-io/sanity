import React from 'react'
import PropTypes from 'prop-types'
import SanityClient from '@sanity/client'

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
        '*[_type == "hintsPackage" && slug.current == $slug][0]{_id, title, slug, links, hints[]->{_id, title, summary, body}}',
        {slug}
      )
      .then(hintsPackage => {
        this.setState({hintsPackage})
      })
      .catch(error => this.setState({error}))
  }

  componentDidMount = () => {
    this.fetchHintsPackage(this.props.slug)
  }

  render() {
    const {hintsPackage, error} = this.state

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
      <div>
        <pre>{JSON.stringify(hintsPackage, null, 2)}</pre>
      </div>
    )
  }
}

export default HintsPackage
