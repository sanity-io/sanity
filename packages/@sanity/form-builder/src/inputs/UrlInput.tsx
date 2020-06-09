import React from 'react'
import {get, uniqueId} from 'lodash'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import {getValidationRule} from '../utils/getValidationRule'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'
export default class UrlInput extends React.Component<Props> {
  _input: TextInput | null
  _inputId = uniqueId('UrlInput')
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
    const {value, markers, type, readOnly, level, onFocus, presence} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    // Use text input for relative URIs
    const uriRule = getValidationRule(type, 'uri')
    const inputType = uriRule && get(uriRule, 'constraint.options.allowRelative') ? 'text' : 'url'
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
          customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
          type={inputType}
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
