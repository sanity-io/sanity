//@flow
import React from 'react'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import {get} from 'lodash'
import PatchEvent, {set, unset} from '../PatchEvent'
import type {Type, Marker} from '../typedefs'

type Props = {
  type: Type,
  level: number,
  value: ?string,
  readOnly: ?boolean,
  onChange: PatchEvent => void,
  onFocus: () => void,
  markers: Array<Marker>
}

export default class NumberInput extends React.Component<Props> {
  _input: ?TextInput

  handleChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value
    this.props.onChange(PatchEvent.from(nextValue === '' ? unset() : set(Number(nextValue))))
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (input: ?TextInput) => {
    this._input = input
  }

  render() {
    const {value = '', readOnly, markers, type, level, onFocus} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')

    // Show numpad on mobile if only positive numbers is preferred
    let onlyPositiveNumber = false
    if (type && type.validation && type.validation.length) {
      type.validation.forEach(rule => {
        if (rule._rules && rule._rules.length) {
          rule._rules.forEach(_r => {
            if (_r.flag === 'min' && _r.constraint >= 0) {
              onlyPositiveNumber = true
            }
          })
        }
      })
    }

    return (
      <FormField markers={markers} level={level} label={type.title} description={type.description}>
        <TextInput
          customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
          type="number"
          value={value}
          readOnly={readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onFocus={onFocus}
          ref={this.setInput}
          pattern={onlyPositiveNumber ? '[\d]*' : undefined}
        />
      </FormField>
    )
  }
}
