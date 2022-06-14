import {useId} from '@reach/auto-id'
import {isTitledListValue, TitledListValue} from '@sanity/types'
import {Box, Card, Flex, Inline, Radio, Select, Stack, Text} from '@sanity/ui'
import {capitalize} from 'lodash'
import React, {forwardRef, useCallback, useMemo} from 'react'
import {ChangeIndicator} from '../../components/changeIndicators'
import {PatchEvent, set, unset} from '../patch'
import {StringInputProps} from '../types'

function toSelectItem(
  option: TitledListValue<string | number> | string | number
): TitledListValue<string | number> {
  return isTitledListValue(option) ? option : {title: capitalize(`${option}`), value: option}
}

const EMPTY_ITEM = {title: '', value: undefined}

export const SelectInput = React.forwardRef(function SelectInput(
  props: StringInputProps,
  forwardedRef: React.ForwardedRef<HTMLSelectElement | HTMLInputElement>
) {
  const {value, readOnly, validationError, schemaType, onChange, onFocus, path, changed, focused} =
    props
  const items = useMemo(
    () => (schemaType.options?.list || []).map(toSelectItem),
    [schemaType.options?.list]
  )
  const currentItem = items.find((item) => item.value === value)
  const isRadio = schemaType.options && schemaType.options.layout === 'radio'

  const itemFromOptionValue = useCallback(
    (optionValue) => {
      const index = Number(optionValue)

      return items[index]
    },
    [items]
  )

  const optionValueFromItem = useCallback(
    (item) => {
      return String(items.indexOf(item))
    },
    [items]
  )

  const inputId = useId()

  const handleChange = React.useCallback(
    (nextItem: TitledListValue<string | number> | null) => {
      onChange(
        PatchEvent.from(typeof nextItem?.value === 'undefined' ? unset() : set(nextItem.value))
      )
    },
    [onChange]
  )

  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextItem = itemFromOptionValue(event.currentTarget.value)

      if (!nextItem) {
        handleChange(EMPTY_ITEM)
        return
      }

      handleChange(nextItem)
    },
    [handleChange, itemFromOptionValue]
  )

  const content = isRadio ? (
    <RadioSelect
      inputId={inputId}
      items={items}
      value={currentItem}
      onChange={handleChange}
      direction={schemaType.options?.direction || 'vertical'}
      ref={forwardedRef as React.ForwardedRef<HTMLInputElement>}
      readOnly={readOnly}
      onFocus={onFocus}
      customValidity={validationError}
    />
  ) : (
    <Select
      onChange={handleSelectChange}
      onFocus={onFocus}
      id={inputId}
      ref={forwardedRef as React.ForwardedRef<HTMLSelectElement>}
      readOnly={readOnly}
      customValidity={validationError}
      value={optionValueFromItem(currentItem)}
    >
      {[EMPTY_ITEM, ...items].map((item, i) => (
        <option key={`${i - 1}`} value={i - 1}>
          {item.title}
        </option>
      ))}
    </Select>
  )
  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
      {content}
    </ChangeIndicator>
  )
})

const RadioSelect = forwardRef(function RadioSelect(
  props: {
    items: TitledListValue<string | number>[]
    value?: TitledListValue<string | number>
    direction: 'horizontal' | 'vertical'
    readOnly?: boolean
    onChange: (value: TitledListValue<string | number> | null) => void
    onFocus: (event: React.FocusEvent<HTMLElement>) => void
    customValidity?: string
    inputId?: string
  },

  ref: React.ForwardedRef<HTMLInputElement>
) {
  const {items, value, onChange, onFocus, readOnly, customValidity, direction, inputId} = props

  const Layout = direction === 'horizontal' ? Inline : Stack
  return (
    <Card border padding={3} radius={1}>
      <Layout space={3} role="group">
        {items.map((item, index) => (
          <RadioSelectItem
            customValidity={customValidity}
            inputId={inputId}
            item={item}
            key={index}
            onChange={onChange}
            onFocus={onFocus}
            readOnly={readOnly}
            ref={index === 0 ? ref : null}
            value={value}
          />
        ))}
      </Layout>
    </Card>
  )
})

const RadioSelectItem = forwardRef(function RadioSelectItem(
  props: {
    customValidity?: string
    inputId?: string
    item: TitledListValue<string | number>
    onChange: (value: TitledListValue<string | number> | null) => void
    onFocus: (event: React.FocusEvent<HTMLElement>) => void
    readOnly?: boolean
    value?: TitledListValue<string | number>
  },

  ref: React.ForwardedRef<HTMLInputElement>
) {
  const {customValidity, inputId, item, onChange, onFocus, readOnly, value} = props

  const handleChange = useCallback(() => {
    onChange(item)
  }, [item, onChange])

  return (
    <Flex as="label" align="center">
      <Radio
        ref={ref}
        checked={value === item}
        onChange={handleChange}
        onFocus={onFocus}
        readOnly={readOnly}
        customValidity={customValidity}
        name={inputId}
      />

      <Box marginLeft={2}>
        <Text size={1} weight="semibold">
          {item.title}
        </Text>
      </Box>
    </Flex>
  )
})
