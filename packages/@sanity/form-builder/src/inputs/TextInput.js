//@flow
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TextArea from 'part:@sanity/components/textareas/default'
import PatchEvent, {set, unset} from '../PatchEvent'
import type {Type, Marker} from '../typedefs'

type Props = {
  type: Type,
  level: number,
  value: ?string,
  readOnly: ?boolean,
  onChange: PatchEvent => void,
  markers: Array<Marker>
}

export default class TextInput extends React.Component<Props> {
  _input: ?TextArea

  handleChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (input: ?TextArea) => {
    this._input = input
  }

  render() {
    const {value, markers, type, readOnly, level, ...rest} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')

    return (
      <FormField markers={markers} level={level} label={type.title} description={type.description}>
        <TextArea
          customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
          value={value}
          readOnly={readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          rows={type.rows}
          ref={this.setInput}
        />
      </FormField>
    )
  }
}
