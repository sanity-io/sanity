import React from 'react'
import PropTypes from 'prop-types'
// import {SanityClient} from '@sanity/client'
import VisionContainer from './containers/VisionContainer'

// Passes the given Sanity client and components to use down
// through context to child components
class Vision extends React.PureComponent<{
  // @todo: Fix typings so that using `SanityClient` works
  // client: SanityClient
  client: any
  components: {
    Button: React.ComponentType
  }
  schema: any
  styles?: {visionGui: Record<string, string>}
}> {
  static childContextTypes = {
    client: PropTypes.shape({config: PropTypes.func}).isRequired,
    schema: PropTypes.object,
    components: PropTypes.object.isRequired,
    styles: PropTypes.object.isRequired,
  }

  getChildContext() {
    return {
      client: this.props.client,
      styles: this.props.styles,
      schema: this.props.schema,
      components: this.props.components,
    }
  }

  render() {
    const {styles = {visionGui: {}}, ...restProps} = this.props

    return <VisionContainer {...restProps} styles={styles} />
  }
}

export default Vision
