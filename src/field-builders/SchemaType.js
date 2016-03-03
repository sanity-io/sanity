import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import FormBuilder from '../FormBuilderPropTypes'
import update from 'react-addons-update'

export default React.createClass({
  propTypes: {
    typeName: FormBuilderPropTypes.type,
    value: PropTypes.object,
    onChange: PropTypes.func
  },


  getDefaultProps() {
    return {
      onChange() {
      }
    }
  },

  handleFieldChange(newVal, propName) {
    this.props.onChange(update(this.props.value || {}, {
      [propName]: {$set: newVal}
    }))
  },

  render() {
    const {value = {}, type} = this.props

    return (
      <FormBuilder key={propName}>
        <h1>{prop.title} ({propName})</h1>
      </FormBuilder>
    )
  }
})
