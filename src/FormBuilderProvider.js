import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'

export default React.createClass({

  propTypes: {
    resolveInputComponent: PropTypes.func.isRequired,
    resolveFieldComponent: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    schema: PropTypes.object.isRequired
  },

  childContextTypes: {
    resolveFieldComponent: PropTypes.func.isRequired,
    resolveInputComponent: PropTypes.func.isRequired,
    schema: PropTypes.object
  },

  getDefaultProps() {
    return {
      children: null
    }
  },

  getChildContext() {
    return {
      schema: this.props.schema,
      resolveInputComponent: this.props.resolveInputComponent,
      resolveFieldComponent: this.props.resolveFieldComponent
    }
  },

  render() {
    return this.props.children
  }
})
