import React from 'react'
import VisionContainer from './containers/VisionContainer'

// Passes the given Sanity client to use down
// through context to child components
class Vision extends React.PureComponent {
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

export default Vision
