import React, {PropTypes} from 'react'
import ObjectContainer from '../../../src/state/ObjectContainer'
import Field from '../../../src/Field'
import Fieldset from '../../../src/Fieldset'


export default React.createClass({
  propTypes: {
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  statics: {
    valueContainer: ObjectContainer
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

  handleLatChange(event) {
    this.handleFieldChange('lat', event.target.value)
  },

  handleLonChange(event) {
    this.handleFieldChange('lon', event.target.value)
  },

  handleFieldChange(fieldName, value) {
    this.props.onChange({
      patch: {
        [fieldName]: {$set: value}
      }
    })
  },

  render() {
    const {value} = this.props
    return (
      <Fieldset title="Langitude and Latitude">
        <Field label="Latitude" role="inFieldset">
          <input type="number" value={value && value.getFieldValue('lat')} onChange={this.handleLatChange} />
        </Field>
        <Field label="Longitude" role="inFieldset">
          <input type="number" value={value && value.getFieldValue('lon')} onChange={this.handleLonChange} />
        </Field>
      </Fieldset>
    )
  }
})
