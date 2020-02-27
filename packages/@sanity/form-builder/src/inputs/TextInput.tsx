import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TextArea from 'part:@sanity/components/textareas/default'
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
export default class TextInput extends React.Component<Props> {
  _input: TextArea | null
  handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }
  focus() {
    if (this._input) {
      this._input.focus()
    }
  }
  setInput = (input: TextArea | null) => {
    this._input = input
  }
  render() {
    const {value, markers, type, readOnly, level, onFocus, onBlur, presence} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    return (
      <FormField
        markers={markers}
        level={level}
        label={type.title}
        description={type.description}
        presence={presence}
      >
        <TextArea
          customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
          value={value}
          readOnly={readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          rows={type.rows}
          ref={this.setInput}
        />
      </FormField>
    )
  }
}
