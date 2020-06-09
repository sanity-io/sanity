import React from 'react'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import {getValidationRule} from '../utils/getValidationRule'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'
import {uniqueId} from 'lodash'
export default class NumberInput extends React.Component<Props, {}> {
  _input: TextInput | null
  _inputId = uniqueId('NumberInput')
  handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value
    this.props.onChange(PatchEvent.from(nextValue === '' ? unset() : set(Number(nextValue))))
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
    const {value = '', readOnly, markers, type, level, onFocus} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    // Show numpad on mobile if only positive numbers is preferred
    const minRule = getValidationRule(type, 'min')
    const onlyPositiveNumber = minRule && minRule.constraint >= 0
    return (
      <FormField
        markers={markers}
        level={level}
        label={type.title}
        description={type.description}
        labelFor={this._inputId}
      >
        <TextInput
          inputId={this._inputId}
          customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
          type="number"
          value={value}
          readOnly={readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onFocus={onFocus}
          ref={this.setInput}
          pattern={onlyPositiveNumber ? '[d]*' : undefined}
        />
      </FormField>
    )
  }
}
