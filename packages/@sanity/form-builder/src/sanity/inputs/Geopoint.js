import PropTypes from 'prop-types'
import React from 'react'
import PatchEvent, {set} from '../../PatchEvent'

export default class GeopointInput extends React.Component {
  static propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {},
    value: {}
  };

  handleLatChange = event => {
    this.handleFieldChange('lat', event.target.value)
  }

  handleLonChange = event => {
    this.handleFieldChange('lon', event.target.value)
  }

  handleFieldChange(fieldName, fieldValue) {
    const {value, onChange} = this.props
    const nextValue = Object.assign({}, value, {
      [fieldName]: fieldValue.trim() ? Number(fieldValue) : undefined
    })
    onChange(PatchEvent.from(set(nextValue)))
  }

  render() {
    const {value} = this.props
    return (
      <div>
        <h4>Moop moop (e.g. a map or something)</h4>
        lat: <input type="number" value={value.lat || ''} onChange={this.handleLatChange} />
        lon: <input type="number" value={value.lon || ''} onChange={this.handleLonChange} />
      </div>
    )
  }
}
