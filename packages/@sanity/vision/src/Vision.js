import React from 'react'
import PropTypes from 'prop-types'
import VisionContainer from './containers/VisionContainer'

// Passes the given Sanity client and components to use down
// through context to child components
class Vision extends React.PureComponent {
  getChildContext() {
    return {
      client: this.props.client,
      styles: this.props.styles,
      schema: this.props.schema,
      components: this.props.components,
    }
  }

  render() {
    return <VisionContainer {...this.props} />
  }
}

Vision.propTypes = {
  client: PropTypes.shape({config: PropTypes.func}).isRequired,
  schema: PropTypes.object,
  components: PropTypes.shape({
    Button: PropTypes.func,
  }).isRequired,
  styles: PropTypes.shape({
    visionGui: PropTypes.object,
  }),
}

Vision.defaultProps = {
  styles: {
    visionGui: {},
  },
}

Vision.childContextTypes = {
  client: PropTypes.shape({config: PropTypes.func}).isRequired,
  schema: PropTypes.object,
  components: PropTypes.object.isRequired,
  styles: PropTypes.object.isRequired,
}

module.exports = Vision
