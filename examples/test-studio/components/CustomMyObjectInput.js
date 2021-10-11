import React from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, set, setIfMissing} from 'part:@sanity/form-builder/patch-event'

export default class CustomMyObjectInput extends React.Component {
  static propTypes = {
    value: PropTypes.object,
    type: PropTypes.object,
    onChange: PropTypes.func,
  }

  handleChange = (field, event) => {
    const {type, onChange} = this.props
    onChange(
      PatchEvent.from(setIfMissing({_type: type.name}), set(event.target.value, [field.name]))
    )
  }

  render() {
    const {value, type} = this.props
    return (
      <div style={{backgroundColor: '#f5ad3d'}}>
        <h3>{type.title}</h3>
        <p>{type.description}</p>
        {type.fields.map((field) => (
          <li key={field.name}>
            <input
              type="text"
              value={(value && value[field.name]) || ''}
              placeholder={type.placeholder}
              onChange={(event) => this.handleChange(field, event)}
            />
          </li>
        ))}
      </div>
    )
  }
}
