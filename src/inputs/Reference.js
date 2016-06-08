import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  render() {
    const {type} = this.props
    return (
      <div>
        <div>Show reference picker for {type.to.map(to => to.type).join(', ')}</div>
      </div>
    )
  }
})
