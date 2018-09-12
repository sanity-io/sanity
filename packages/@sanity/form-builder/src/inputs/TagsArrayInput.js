// @flow
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TagInput from 'part:@sanity/components/tags/textfield'
import PatchEvent, {set, unset} from '../../PatchEvent'
import type {Type} from '../typedefs'

type Props = {
  type: Type,
  value: Array<string>,
  level: number,
  readOnly: ?boolean,
  onChange: PatchEvent => void,
  onFocus: () => void
}

export default class TagsArrayInput extends React.PureComponent<Props> {
  _input: TagInput

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

  setInput = (el: ?TagInput) => {
    this._input = el
  }

  render() {
    const {type, value, readOnly, level, onFocus} = this.props
    return (
      <FormField level={level} label={type.title} description={type.description}>
        <TagInput
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
