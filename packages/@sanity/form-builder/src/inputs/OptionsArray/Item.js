// @flow
import React from 'react'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import Preview from '../../Preview'
import {isLegacyOptionsItem, resolveValueWithLegacyOptionsSupport} from './legacyOptionsSupport'
import type {Type} from '../../typedefs'

type Props = {
  type: Type,
  value: any,
  checked: boolean,
  onChange: (boolean, any) => void
}
export default class Item extends React.PureComponent<Props> {
  handleChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const {onChange, value} = this.props
    onChange(event.currentTarget.checked, value)
  }

  render() {
    const {value, checked, type} = this.props
    return (
      <Checkbox
        onChange={this.handleChange}
        checked={checked}
      >
        {isLegacyOptionsItem(value)
          ? value.title
          : <Preview type={type} value={resolveValueWithLegacyOptionsSupport(value)} />
        }
      </Checkbox>
    )
  }
}
