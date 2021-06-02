import React from 'react'
import PropTypes from 'prop-types'
// import {SanityClient} from '@sanity/client'
import {VisionContainer} from './containers/VisionContainer'

// Passes the given Sanity client and components to use down
// through context to child components
export class Vision extends React.PureComponent<{
  // @todo: Fix typings so that using `SanityClient` works
  // client: SanityClient
  client: any
  schema: any
}> {
  static childContextTypes = {
    client: PropTypes.shape({config: PropTypes.func}).isRequired,
    schema: PropTypes.object,
  }

  getChildContext() {
    return {
      client: this.props.client,
      schema: this.props.schema,
    }
  }

  render() {
    return <VisionContainer {...this.props} />
  }
}
