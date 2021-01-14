import React from 'react'
import {uniqueId} from 'lodash'
import TagInput from 'part:@sanity/components/tags/textfield'
import {FormField} from '@sanity/base/components'
import {TagInput} from '../components/tagInput'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

export default class TagsArrayInput extends React.PureComponent<Props<string[]>> {
  _input: HTMLInputElement
  _inputId = uniqueId('TagsArrayInput')
  set(nextValue: string[]) {
    const patch = nextValue.length === 0 ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
  }
  handleChange = (nextValue: {value: string}[]) => {
    this.set(nextValue.map((v) => v.value))
  }
  focus() {
    if (this._input) {
      this._input.focus()
    }
  }
  setInput = (el: HTMLInputElement | null) => {
    this._input = el
  }
  render() {
    const {type, value, readOnly, level, markers, onFocus, presence} = this.props

    const tagInputValue = value.map((v) => ({value: v}))

    return (
      <FormField
        level={level}
        title={type.title}
        description={type.description}
        __unstable_presence={presence}
        inputId={this._inputId}
        __unstable_markers={markers}
      >
        <TagInput
          id={this._inputId}
          readOnly={readOnly}
          value={tagInputValue}
          onChange={this.handleChange}
          onFocus={onFocus}
          ref={this.setInput}
        />
      </FormField>
    )
  }
}
