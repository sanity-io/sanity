import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TagInput from 'part:@sanity/components/tags/textfield'
import PatchEvent, {set, unset} from '../../PatchEvent'
import {Props} from './types'
import {uniqueId} from 'lodash'

export default class TagsArrayInput extends React.PureComponent<Props> {
  _input: TagInput
  _inputId = uniqueId('TagsArrayInput')
  set(nextValue: string[]) {
    const patch = nextValue.length === 0 ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
  }
  handleChange = (nextValue: Array<string>) => {
    this.set(nextValue)
  }
  focus() {
    if (this._input) {
      this._input.focus()
    }
  }
  setInput = (el: TagInput | null) => {
    this._input = el
  }
  render() {
    const {type, value, readOnly, level, onFocus, presence} = this.props
    return (
      <FormField
        level={level}
        label={type.title}
        description={type.description}
        presence={presence}
        labelFor={this._inputId}
      >
        <TagInput
          inputId={this._inputId}
          readOnly={readOnly}
          value={value}
          onChange={this.handleChange}
          onFocus={onFocus}
          ref={this.setInput}
        />
      </FormField>
    )
  }
}
