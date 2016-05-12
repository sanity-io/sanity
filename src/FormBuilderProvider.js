import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'

export default React.createClass({

  propTypes: {
    resolveFieldInput: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    schema: PropTypes.object.isRequired
  },

  childContextTypes: {
    resolveFieldInput: PropTypes.func.isRequired,
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
      resolveFieldInput: this.props.resolveFieldInput
    }
  },

  render() {
    return this.props.children
  }
})
