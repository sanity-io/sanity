import React from 'react'
import {uniqueId} from 'lodash'
import TagInput from 'part:@sanity/components/tags/textfield'
import PatchEvent, {set, unset} from '../PatchEvent'
import {FormField} from '../components/FormField'
import {Props} from './types'

export default class TagsArrayInput extends React.PureComponent<Props<string[]>> {
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
    const {type, value, readOnly, level, markers, onFocus, presence} = this.props
    return (
      <FormField
        level={level}
        title={type.title}
        description={type.description}
        presence={presence}
        htmlFor={this._inputId}
        markers={markers}
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
