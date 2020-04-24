import React from 'react'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import PatchEvent, {set} from '../PatchEvent'
import ValidationStatus from 'part:@sanity/components/validation/status'
import FieldStatus from '@sanity/components/lib/fieldsets/FieldStatus'
import {Container as PresenceContainer} from '@sanity/components/lib/presence'
import {Type} from '../typedefs'
type Props = {
  type: Type
  value: boolean | null
  readOnly: boolean | null
  onFocus: () => void
  onChange: (arg0: PatchEvent) => void
  markers: any
  presence: any
}
// Todo: support indeterminate state, see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
export default class BooleanInput extends React.Component<Props> {
  _input: (Checkbox | Switch) | null

  state = {
    showValidationList: false
  }

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

  handleToggleValidationList = event => {
    this.setState({
      showValidationList: !this.state.showValidationList
    })
  }

  render() {
    const {value, type, readOnly, onFocus, markers, presence} = this.props
    const isCheckbox = type.options && type.options.layout === 'checkbox'
    return (
      <div style={{display: 'flex'}}>
        {isCheckbox ? (
          <Checkbox
            readOnly={readOnly}
            onChange={this.handleChange}
            checked={value}
            ref={this.setInput}
            onFocus={onFocus}
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
        )}
        <FieldStatus position="top">
          <ValidationStatus markers={markers} onClick={this.handleToggleValidationList} />
          <PresenceContainer presence={presence} />
        </FieldStatus>
      </div>
    )
  }
}
