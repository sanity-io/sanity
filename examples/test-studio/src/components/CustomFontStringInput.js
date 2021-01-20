import {FormField} from '@sanity/base/components'
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
    const {level = 0, markers, onBlur, onFocus, presence, type, value} = this.props

    return (
      <FormField
        __unstable_markers={markers}
        __unstable_presence={presence}
        description={type.description}
        level={level}
        title={type.title}
        // style={{backgroundColor: '#39f'}}
      >
        <input
          type="text"
          className={styles.input}
          placeholder={type.placeholder}
          onBlur={onBlur}
          onChange={this.handleChange}
          onFocus={onFocus}
          value={value}
          style={{width: '100%', boxSixing: 'border-box'}}
        />
      </FormField>
    )
  }
}
