import React from 'react'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'
import {uniqueId} from 'lodash'
export default class EmailInput extends React.Component<Props, {}> {
  _input: TextInput | null
  _inputId = uniqueId('EmailInput')
  handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }
  focus() {
    if (this._input) {
      this._input.focus()
    }
  }
  setInput = (input: TextInput | null) => {
    this._input = input
  }
  render() {
    const {value, readOnly, type, markers, level, onFocus, presence} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    return (
      <FormField
        markers={markers}
        level={level}
        label={type.title}
        description={type.description}
        presence={presence}
        labelFor={this._inputId}
      >
        <TextInput
          inputId={this._inputId}
          type="email"
          customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
          value={value}
          readOnly={readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onFocus={onFocus}
          ref={this.setInput}
        />
      </FormField>
    )
  }
}
