import {set, StringInputProps} from 'sanity'
import React from 'react'
import styles from './CustomFontStringInput.module.css'

export default class CustomStringInput extends React.Component<StringInputProps> {
  handleChange = (event) => {
    this.props.onChange(set(event.target.value))
  }

  render() {
    const {value, schemaType} = this.props
    return (
      <div>
        <h3>{schemaType.title}</h3>
        <p>{schemaType.description}</p>
        <input
          type="text"
          className={styles.input}
          placeholder={schemaType.placeholder}
          onChange={this.handleChange}
          value={value}
        />
      </div>
    )
  }
}
