import React from 'react'
import {set} from 'sanity'

export default class CustomStringInput extends React.Component {
  handleChange = (event) => {
    this.props.onChange(set(event.target.value))
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
