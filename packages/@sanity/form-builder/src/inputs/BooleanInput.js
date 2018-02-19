// @flow
import React from 'react'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import PatchEvent, {set} from '../PatchEvent'
import type {Type} from '../typedefs'

type Props = {
  type: Type,
  value: ?boolean,
  readOnly: ?boolean,
  level: number,
  description: ?string,
  onChange: PatchEvent => void
}

// Todo: support indeterminate state, see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
export default class BooleanInput extends React.Component<Props> {
  _input: ?(Checkbox | Switch)

  handleChange = (event: SyntheticEvent<HTMLInputElement>) => {
    this.props.onChange(PatchEvent.from(set(event.currentTarget.checked)))
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (input: ?(Checkbox | Switch)) => {
    this._input = input
  }

  render() {
    const {value, type, readOnly, level, description, ...rest} = this.props

    const isCheckbox = type.options && type.options.layout === 'checkbox'
    return isCheckbox ? (
      <Checkbox
        {...rest}
        readOnly={readOnly}
        onChange={this.handleChange}
        checked={value}
        ref={this.setInput}
      >
        {type.title}
      </Checkbox>
    ) : (
      <Switch
        {...rest}
        readOnly={readOnly}
        onChange={this.handleChange}
        checked={value}
        label={type.title}
        ref={this.setInput}
      />
    )
  }
}
