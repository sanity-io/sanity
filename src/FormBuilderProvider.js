import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'

export default React.createClass({

  propTypes: {
    resolveFieldInput: PropTypes.func.isRequired,
    resolveFieldRenderer: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    schema: PropTypes.object.isRequired
  },

  childContextTypes: {
    resolveFieldRenderer: PropTypes.func.isRequired,
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
      resolveFieldInput: this.props.resolveFieldInput,
      resolveFieldRenderer: this.props.resolveFieldRenderer
    }
  },

  render() {
    return this.props.children
  }
})
