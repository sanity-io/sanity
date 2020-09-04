import React from 'react'
import {get} from 'lodash'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import PatchEvent, {set, unset} from '../../PatchEvent'
import {resolveTypeName} from '../../utils/resolveTypeName'
import {Type} from '../../typedefs'
import Warning from '../Warning'
import Item from './Item'
import styles from './styles/OptionsArrayInput.css'
import {resolveValueWithLegacyOptionsSupport, isLegacyOptionsItem} from './legacyOptionsSupport'

function isEqual(item, otherItem) {
  if (isLegacyOptionsItem(item) || isLegacyOptionsItem(otherItem)) {
    return item.value === otherItem.value
  }
  if (item === otherItem) {
    return true
  }
  if (typeof item !== typeof otherItem) {
    return false
  }
  if (typeof item !== 'object' && !Array.isArray(item)) {
    return item === otherItem
  }
  if (item._key && item._key === otherItem._key) {
    return true
  }
  if (Array.isArray(item)) {
    if (!item.length !== otherItem.length) {
      return false
    }
    return item.every((it, i) => isEqual(item[i], otherItem[i]))
  }
  const keys = Object.keys(item)
  const otherKeys = Object.keys(item)
  if (keys.length !== otherKeys.length) {
    return false
  }
  return keys.every(keyName => isEqual(item[keyName], otherItem[keyName]))
}
function inArray(array, candidate) {
  return array ? array.some(item => isEqual(item, candidate)) : false
}
type OptionsArrayInputProps = {
  type?: Type
  markers?: any[]
  value?: any[]
  level?: number
  readOnly?: boolean
  onChange?: (...args: any[]) => any
  presence: any
  onFocus: (path: any[]) => void
}
export default class OptionsArrayInput extends React.PureComponent<OptionsArrayInputProps, {}> {
  handleChange = (isChecked, optionValue) => {
    const {type, value = []} = this.props
    const list = get(type.options, 'list')
    if (!isChecked && optionValue._key) {
      // This is an optimization that only works if list items are _keyed
      this.props.onChange(PatchEvent.from(unset([{_key: optionValue._key}])))
    }
    const nextValue = list
      .filter(item =>
        isEqual(optionValue, item)
          ? isChecked
          : inArray(value, resolveValueWithLegacyOptionsSupport(item))
      )
      .map(resolveValueWithLegacyOptionsSupport)
    this.props.onChange(PatchEvent.from(nextValue.length > 0 ? set(nextValue) : unset()))
  }
  getMemberTypeOfItem(option) {
    const {type} = this.props
    return type.of.find(
      memberType =>
        memberType.name === resolveTypeName(resolveValueWithLegacyOptionsSupport(option))
    )
  }

  handleFocus = () => {
    this.props.onFocus([FOCUS_TERMINATOR])
  }

  renderInvalidOptions = options => {
    const invalidOptions = options
      .filter(option => !this.getMemberTypeOfItem(option))
      .map(option => resolveTypeName(resolveValueWithLegacyOptionsSupport(option)))
    const len = invalidOptions.length
    const heading = (
      <>
        Found {len === 1 ? <>an</> : len} invalid option {len === 1 ? <>type</> : <>types</>}
      </>
    )
    if (invalidOptions.length < 1) {
      return null
    }
    return <Warning heading={heading} values={invalidOptions} />
  }

  render() {
    const {type, markers, value, level, readOnly, presence} = this.props
    const options = get(type.options, 'list')
    const direction = get(type.options, 'direction') // vertical and horizontal
    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        markers={markers}
        presence={presence}
        level={level}
        onClick={this.handleFocus}
      >
        <div>
          <div
            className={
              direction === 'vertical' ? styles.itemWrapperVertical : styles.itemWrapperHorizontal
            }
          >
            {options.map((option, index) => {
              const optionType = this.getMemberTypeOfItem(option)
              if (!optionType) {
                return null
              }
              const checked = inArray(value, resolveValueWithLegacyOptionsSupport(option))
              return (
                <div
                  className={direction === 'vertical' ? styles.itemVertical : undefined}
                  key={option._key || index}
                >
                  <Item
                    type={optionType}
                    readOnly={readOnly}
                    value={option}
                    checked={checked}
                    onChange={this.handleChange}
                  />
                </div>
              )
            })}
          </div>
          {this.renderInvalidOptions(options)}
        </div>
      </Fieldset>
    )
  }
}
