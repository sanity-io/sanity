import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

// Just a stub for now
export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.string,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: PropTypes.object
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  handleItemChange() {

  },

  renderItem(item) {
  },

  render() {
    const {type} = this.props
    return (
      <div>
        (show list of {type.of.map(item => item.type).join(', ')} here)
      </div>
    )
  }
})
