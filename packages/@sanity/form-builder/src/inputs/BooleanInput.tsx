import React from 'react'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import PatchEvent, {set} from '../PatchEvent'
import {Type} from '../typedefs'
type Props = {
  type: Type
  value: boolean | null
  readOnly: boolean | null
  onFocus: () => void
  onChange: (arg0: PatchEvent) => void
}
// Todo: support indeterminate state, see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
export default class BooleanInput extends React.Component<Props> {
  _input: (Checkbox | Switch) | null
  handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    this.props.onChange(PatchEvent.from(set(event.currentTarget.checked)))
  }
  focus() {
    if (this._input) {
      this._input.focus()
    }
  }
  setInput = (input: (Checkbox | Switch) | null) => {
    this._input = input
  }
  render() {
    const {value, type, readOnly, onFocus} = this.props
    const isCheckbox = type.options && type.options.layout === 'checkbox'
    return isCheckbox ? (
      <Checkbox
        readOnly={readOnly}
        onChange={this.handleChange}
        checked={value}
        ref={this.setInput}
        description={type.description}
      >
        {type.title}
      </Checkbox>
    ) : (
      <Switch
        readOnly={readOnly}
        checked={value}
        label={type.title}
        description={type.description}
        onChange={this.handleChange}
        onFocus={onFocus}
        ref={this.setInput}
      />
    )
  }
}
