import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default class extends React.Component {
  static propTypes = {
    field: FormBuilderPropTypes.field,
    value: PropTypes.bool,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  handleChange(e) {
    this.props.onChange(e.target.checked)
  }

  getSchemaType(typeName) {
    return this.context.schema.types[typeName]
  }

  resolveInputComponent(field) {
    return this.context.resolveInputComponent(field)
  }

  render() {
    const {value} = this.props
    const latlonDef = this.getSchemaType('latlon')
    const LatLonFieldInput = this.resolveInputComponent(latlonDef)
    return (
      <div>
        <pre>{JSON.stringify(this.props, null, 2)}</pre>
        <LatLonFieldInput field={latlonDef} type={latlonDef} onChange={e => console.log(e)} />
      </div>
    )
  }
};
