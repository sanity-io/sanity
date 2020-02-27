import React from 'react'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Type, Marker} from '../typedefs'
type Props = {
  type: Type
  level: number
  value: string | null
  readOnly: boolean | null
  onChange: (arg0: PatchEvent) => void
  onFocus: () => void
  onBlur: () => void
  markers: Array<Marker>
  presence: any
}
export default class StringInput extends React.Component<Props> {
  _input: TextInput | null
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
    const {value, readOnly, type, markers, level, onFocus, onBlur, presence} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    return (
      <FormField markers={markers} level={level} label={type.title} description={type.description} presence={presence}>
        <TextInput
          customValidity={errors.length > 0 ? errors[0].item.message : ''}
          type="text"
          value={value}
          readOnly={readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          ref={this.setInput}
        />
      </FormField>
    )
  }
}
