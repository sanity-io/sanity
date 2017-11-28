//@flow
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TextArea from 'part:@sanity/components/textareas/default'
import PatchEvent, {set, unset} from '../PatchEvent'
import type {Type} from '../typedefs'

type Props = {
  type: Type,
  level: number,
  value: ?string,
  onChange: PatchEvent => void
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
    const {value, type, level, ...rest} = this.props

    return (
      <FormField
        level={level}
        label={type.title}
        description={type.description}
      >
        <TextArea
          {...rest}
          value={value}
          readOnly={type.readOnly}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          rows={type.rows}
          ref={this.setInput}
        />
      </FormField>
    )
  }
}
