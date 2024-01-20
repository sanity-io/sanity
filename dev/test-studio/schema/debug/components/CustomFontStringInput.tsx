import {Component} from 'react'
import {set, type StringInputProps} from 'sanity'

import styles from './CustomFontStringInput.module.css'

export default class CustomStringInput extends Component<StringInputProps> {
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
