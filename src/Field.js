import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import {eq} from 'lodash'

const Field = React.createClass({
  propTypes: {
    builder: PropTypes.func.isRequired, // react element
    field: FormBuilderPropTypes.field.isRequired,
    name: PropTypes.string,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  shouldComponentUpdate(nextProps) {
    const shouldUpdate = !eq(this.props, nextProps)
    if (!shouldUpdate) {
      console.log('Skip update in ', this.props.name)
    }
    return shouldUpdate
  },

  handleChange(newValue) {
    this.props.onChange(newValue, this.props.name)
  },

  render() {
    const {field, name, value, builder} = this.props
    const FieldBuilder = builder
    return (
      <div key={name}>
        {/* <pre>{JSON.stringify(field, null, 2)}</pre> */}
        <FieldBuilder value={value} onChange={this.handleChange} field={field} />
      </div>
    )
  }
})

export default Field
