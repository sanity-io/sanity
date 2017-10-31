// @flow
import React from 'react'
import {FormBuilderInput} from '../../FormBuilderInput'
import PatchEvent from '../../PatchEvent'

export default class ItemForm extends React.Component<*, *, *> {
  props: {
    value: Object,
    type: any,
    level: number,
    onChange: (event: PatchEvent, value: Object) => void
  }

  handleChange = (event : PatchEvent) => {
    const {value, onChange} = this.props
    onChange(event, value)
  }

  render() {
    const {value, type, level, onFocus, onBlur, focusPath} = this.props
    return (
      <FormBuilderInput
        value={value}
        type={type}
        onFocus={onFocus}
        onBlur={onBlur}
        focusPath={focusPath}
        level={level}
        onChange={this.handleChange}
        autoFocus
      />
    )
  }
}
