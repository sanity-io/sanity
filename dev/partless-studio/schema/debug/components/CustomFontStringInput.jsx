import {PatchEvent, set} from '@sanity/base/form'
import PropTypes from 'prop-types'
import React from 'react'
import styles from './CustomFontStringInput.module.css'

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
      <div>
        <h3>{type.title}</h3>
        <p>{type.description}</p>
        <input
          type="text"
          className={styles.input}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          value={value}
        />
      </div>
    )
  }
}
