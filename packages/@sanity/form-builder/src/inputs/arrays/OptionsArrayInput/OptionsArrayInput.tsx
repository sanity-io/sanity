import React from 'react'
import {get} from 'lodash'
import {ArraySchemaType, isTitledListValue, Marker, Path} from '@sanity/types'
import {Box, Checkbox, Flex, Text} from '@sanity/ui'
import {FormFieldPresence} from '@sanity/base/lib/presence'
import PatchEvent, {set, unset} from '../../../PatchEvent'
import {resolveTypeName} from '../../../utils/resolveTypeName'
import Warning from '../../Warning'
import {Fieldset} from '../../../transitional/Fieldset'
import Preview from '../../../Preview'
import {ItemWithMissingType} from '../ArrayOfObjectsInput/item/ItemWithMissingType'
import {Item, List} from '../common/list'
import {resolveValueWithLegacyOptionsSupport, isLegacyOptionsItem} from './legacyOptionsSupport'

type Focusable = {focus: () => void}

const changeIndicatorOptions = {compareDeep: true}

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
  return keys.every((keyName) => isEqual(item[keyName], otherItem[keyName]))
}

function inArray(array, candidate) {
  return array ? array.some((item) => isEqual(item, candidate)) : false
}

type OptionsArrayInputProps = {
  type: ArraySchemaType
  markers?: Marker[]
  value?: unknown[]
  level?: number
  readOnly?: boolean
  onChange?: (...args: any[]) => any
  presence: FormFieldPresence[]
  onFocus: (path: Path) => void
  onBlur: () => void
}

export default class OptionsArrayInput extends React.PureComponent<OptionsArrayInputProps> {
  _element: Focusable | null

  handleChange = (isChecked, optionValue) => {
    const {type, value = []} = this.props
    const list = get(type.options, 'list')
    if (!isChecked && optionValue._key) {
      // This is an optimization that only works if list items are _keyed
      this.props.onChange(PatchEvent.from(unset([{_key: optionValue._key}])))
    }
    const nextValue = list
      .filter((item) =>
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
      (memberType) =>
        memberType.name === resolveTypeName(resolveValueWithLegacyOptionsSupport(option))
    )
  }

  setElement = (el: Focusable | null) => {
    this._element = el
  }

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  handleFocus = (index: number) => {
    this.props.onFocus([index])
  }

  renderInvalidOptions = (options) => {
    const invalidOptions = options
      .filter((option) => !this.getMemberTypeOfItem(option))
      .map((option) => resolveTypeName(resolveValueWithLegacyOptionsSupport(option)))
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
    const {type, markers, value, level, readOnly, presence, onFocus, onBlur} = this.props
    const options = type.options?.list || []

    // note: direction was never documented and makes more sense to use "grid" for it too
    const isGrid = type.options?.direction === 'horizontal' || type.options?.layout === 'grid'

    return (
      <Fieldset
        ref={this.setElement}
        legend={type.title}
        description={type.description}
        markers={markers}
        presence={presence}
        level={level}
        changeIndicator={changeIndicatorOptions}
      >
        <List isGrid={isGrid} isSortable>
          {options.map((option, index) => {
            const optionType = this.getMemberTypeOfItem(option)
            const checked = inArray(value, resolveValueWithLegacyOptionsSupport(option))
            const disabled = !optionType || readOnly || optionType?.readOnly
            return (
              <Item index={index} isGrid={isGrid} key={index}>
                <Flex align="center" as="label" muted={disabled}>
                  <Checkbox
                    disabled={disabled}
                    checked={checked}
                    onChange={(e) => this.handleChange(e.currentTarget.checked, option)}
                    onFocus={() => this.handleFocus(index)}
                    onBlur={onBlur}
                  />
                  <Box marginLeft={2}>
                    {optionType &&
                      (isTitledListValue(optionType) ? (
                        <Text>{option.title}</Text>
                      ) : (
                        <Preview
                          layout="grid"
                          type={optionType}
                          value={resolveValueWithLegacyOptionsSupport(option)}
                        />
                      ))}
                    {!optionType && (
                      <ItemWithMissingType value={option} onFocus={() => onFocus([])} />
                    )}
                  </Box>
                </Flex>
              </Item>
            )
          })}
        </List>
      </Fieldset>
    )
  }
}
