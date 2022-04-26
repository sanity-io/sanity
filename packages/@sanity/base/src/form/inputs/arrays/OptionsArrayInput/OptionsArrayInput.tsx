import React from 'react'
import {get} from 'lodash'
import {isTitledListValue} from '@sanity/types'
import {Box, Checkbox, Flex, Text} from '@sanity/ui'
import {resolveTypeName} from '@sanity/util/content'
import {FormFieldSet} from '../../../components/formField'
import {set, unset} from '../../../patch'
import {ArrayInputProps, FIXME} from '../../../types'
import {FormNodePreview} from '../../../FormNodePreview'
import {ItemWithMissingType} from '../ArrayOfObjectsInput/item/ItemWithMissingType'
import {Item, List} from '../common/list'
import {useConditionalReadOnly} from '../../../../conditional-property/conditionalReadOnly'
import {resolveValueWithLegacyOptionsSupport, isLegacyOptionsItem} from './legacyOptionsSupport'

type Focusable = {focus: () => void}

const changeIndicatorOptions = {compareDeep: true}

function isEqual(item: any, otherItem: any): boolean {
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

function inArray(array: unknown[], candidate: unknown) {
  return array ? array.some((item) => isEqual(item, candidate)) : false
}

type OptionsArrayInputProps = ArrayInputProps<unknown[]>

export class OptionsArrayInput extends React.PureComponent<OptionsArrayInputProps> {
  _element: Focusable | null = null

  handleChange = (isChecked: boolean, optionValue: any) => {
    const {type, value = []} = this.props
    const list = get(type.options, 'list') as FIXME[]
    if (!isChecked && optionValue._key) {
      // This is an optimization that only works if list items are _keyed
      this.props.onChange(unset([{_key: optionValue._key}]))
    }
    const nextValue = list
      .filter((item) =>
        isEqual(optionValue, item)
          ? isChecked
          : inArray(value, resolveValueWithLegacyOptionsSupport(item))
      )
      .map(resolveValueWithLegacyOptionsSupport)
    this.props.onChange(nextValue.length > 0 ? set(nextValue) : unset())
  }

  getMemberTypeOfItem(option: any) {
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
    const {inputProps} = this.props
    inputProps.onFocus([index])
  }

  render() {
    const {inputProps, type, validation, value, level, presence} = this.props
    const {onFocus, onBlur, readOnly} = inputProps
    const options: any[] = type.options?.list || []

    // note: direction was never documented and makes more sense to use "grid" for it too
    const isGrid = type.options?.direction === 'horizontal' || type.options?.layout === 'grid'

    return (
      <FormFieldSet
        ref={this.setElement}
        title={type.title}
        description={type.description}
        __unstable_presence={presence}
        level={level}
        __unstable_changeIndicator={changeIndicatorOptions}
        validation={validation}
        onSetCollapsed={() => console.warn('todo')}
      >
        <List isGrid={isGrid}>
          {options.map((option, index) => {
            const optionType = this.getMemberTypeOfItem(option)
            const checked = inArray(value || [], resolveValueWithLegacyOptionsSupport(option))
            const disabled = !optionType
            const isTitled = isTitledListValue(option)
            return (
              <Item index={index} isGrid={isGrid} key={index}>
                <Flex align="center" as="label" muted={disabled}>
                  <WrappedCheckbox
                    disabled={disabled}
                    checked={checked}
                    onChange={(e) => this.handleChange(e.currentTarget.checked, option)}
                    onFocus={() => this.handleFocus(index)}
                    onBlur={onBlur}
                  />

                  {optionType &&
                    (isTitled ? (
                      <Box padding={2}>
                        <Text>{option.title}</Text>
                      </Box>
                    ) : (
                      <Box marginLeft={2}>
                        <FormNodePreview
                          layout="grid"
                          type={optionType}
                          value={resolveValueWithLegacyOptionsSupport(option)}
                        />
                      </Box>
                    ))}

                  {!optionType && (
                    <ItemWithMissingType value={option} onFocus={() => onFocus([])} />
                  )}
                </Flex>
              </Item>
            )
          })}
        </List>
      </FormFieldSet>
    )
  }
}

const WrappedCheckbox = (props: React.HTMLProps<HTMLInputElement>) => {
  const {disabled, checked, onChange, onFocus, onBlur} = props
  const readOnly = useConditionalReadOnly()

  return (
    <Checkbox
      disabled={disabled}
      checked={checked}
      readOnly={readOnly === true}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
}
