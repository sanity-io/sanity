import React from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, set} from 'part:@sanity/form-builder/patch-event'
import styles from './CustomFontStringInput.css'

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
