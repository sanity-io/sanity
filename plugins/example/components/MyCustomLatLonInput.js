import React, {PropTypes} from 'react'
import ObjectContainer from '../../../src/state/ObjectContainer'

export default React.createClass({
  propTypes: {
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  statics: {
    valueContainer: ObjectContainer
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

  handleLatChange(event) {
    this.handleFieldChange('lon', event.target.value)
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
      <div>
        <div>Lat: <input type="number" value={value && value.getFieldValue('lat')} onChange={this.handleLatChange} /></div>
        <div>Lon: <input type="number" value={value && value.getFieldValue('lon')} onChange={this.handleLonChange} /></div>
      </div>
    )
  }
})
