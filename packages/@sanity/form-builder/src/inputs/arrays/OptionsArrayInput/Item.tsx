import React from 'react'
import {SchemaType, isTitledListValue, TitledListValue, Path} from '@sanity/types'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import Preview from '../../../Preview'
import {resolveValueWithLegacyOptionsSupport} from './legacyOptionsSupport'

type Props = {
  type: SchemaType
  value: TitledListValue | unknown
  checked: boolean
  onChange: (checked: boolean, item: any) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  readOnly: boolean | null
}

export default class Item extends React.PureComponent<Props> {
  handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const {onChange, value} = this.props
    onChange(event.currentTarget.checked, value)
  }

  render() {
    const {value, checked, type, onFocus, onBlur, readOnly} = this.props
    return (
      <Checkbox
        onChange={this.handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        checked={checked}
        readOnly={readOnly || type.readOnly}
        label={
          isTitledListValue(value) ? (
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
