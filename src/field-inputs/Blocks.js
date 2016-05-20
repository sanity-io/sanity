import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.bool,
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

  handleChange(e) {
    this.props.onChange(e.target.checked)
  },

  getSchemaType(typeName) {
    return this.context.schema.types[typeName]
  },

  resolveFieldInput(field) {
    return this.context.resolveFieldInput(field)
  },

  render() {
    const {value} = this.props
    const latlonDef = this.getSchemaType('latlon')
    const LatLonFieldInput = this.resolveFieldInput(latlonDef)
    return (
      <div>
        <pre>{JSON.stringify(this.props, null, 2)}</pre>
        <LatLonFieldInput field={latlonDef} type={latlonDef} onChange={e => console.log(e)} />
      </div>
    )
  }

})
