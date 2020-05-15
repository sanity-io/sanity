import React from 'react'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import Preview from '../../Preview'
import {isLegacyOptionsItem, resolveValueWithLegacyOptionsSupport} from './legacyOptionsSupport'
import {Type} from '../../typedefs'
type Props = {
  type: Type
  value: any
  checked: boolean
  onChange: (arg0: boolean, arg1: any) => void
  readOnly: boolean | null
}
export default class Item extends React.PureComponent<Props, {}> {
  handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const {onChange, value} = this.props
    onChange(event.currentTarget.checked, value)
  }
  render() {
    const {value, checked, type, readOnly} = this.props
    return (
      <Checkbox
        onChange={this.handleChange}
        checked={checked}
        readOnly={readOnly || type.readOnly}
        label={
          isLegacyOptionsItem(value) ? (
            value.title
          ) : (
            <Preview
              layout="inline"
              type={type}
              value={resolveValueWithLegacyOptionsSupport(value)}
            />
          )
        }
      />
    )
  }
}
