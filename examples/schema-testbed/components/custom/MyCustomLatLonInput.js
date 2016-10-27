import React, {PropTypes} from 'react'

export default class MyCustomLatLonInput extends React.Component {

  static propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {},
    value: {}
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  constructor(props, context) {
    super(props, context)
    this.handleLatChange = this.handleLatChange.bind(this)
    this.handleLonChange = this.handleLonChange.bind(this)
  }

  handleLatChange(event) {
    this.handleFieldChange('lat', event.target.value)
  }

  handleLonChange(event) {
    this.handleFieldChange('lon', event.target.value)
  }

  handleFieldChange(fieldName, fieldValue) {
    const {value, onChange} = this.props
    const nextValue = Object.assign({_type: 'latlon'}, value, {
      [fieldName]: fieldValue.trim() ? Number(fieldValue) : undefined
    })
    onChange({patch: {type: 'set', value: nextValue}})
  }

  render() {
    const {value} = this.props
    return (
      <div>
        <h4>Custom lat lon input (e.g. a map or something)</h4>
        lat: <input type="number" value={value.lat || ''} onChange={this.handleLatChange} />
        lon: <input type="number" value={value.lon || ''} onChange={this.handleLonChange} />
      </div>
    )
  }
}
