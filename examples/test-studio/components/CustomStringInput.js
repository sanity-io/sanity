import React from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, set} from 'part:@sanity/form-builder/patch-event'

export default class CustomStringInput extends React.Component {
  static propTypes = {
    value: PropTypes.string,
    type: PropTypes.object,
    onChange: PropTypes.func,
  }
  handleChange = (event) => {
    this.props.onChange(PatchEvent.from(set(event.target.value)))
  }

  render() {
    const {value, type} = this.props
    return (
      <div style={{backgroundColor: '#f5ad3d'}}>
        <h3>{type.title}</h3>
        <p>{type.description}</p>
        <input
          type="text"
          placeholder={type.placeholder}
          onChange={this.handleChange}
          value={value}
        />
      </div>
    )
  }
}
