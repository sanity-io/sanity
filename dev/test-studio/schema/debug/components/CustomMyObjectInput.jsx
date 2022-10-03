import React from 'react'
import {set, setIfMissing} from 'sanity'

export default class CustomMyObjectInput extends React.Component {
  handleChange = (field, event) => {
    const {type, onChange} = this.props
    onChange(setIfMissing({_type: type.name}), set(event.target.value, [field.name]))
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
