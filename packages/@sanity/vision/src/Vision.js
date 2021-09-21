import React from 'react'
import PropTypes from 'prop-types'
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

Vision.propTypes = {
  client: PropTypes.shape({config: PropTypes.func}).isRequired,
  schema: PropTypes.object,
}

Vision.childContextTypes = {
  client: PropTypes.shape({config: PropTypes.func}).isRequired,
  schema: PropTypes.object,
}

export default Vision
