import React, {useMemo, useCallback, forwardRef} from 'react'
import {capitalize} from 'lodash'
import {useId} from '@reach/auto-id'
import {isTitledListValue, TitledListValue} from '@sanity/types'
import {Inline, Stack, Card, Text, Select, Flex, Radio, Box} from '@sanity/ui'
import {FormField} from '../components/FormField'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

function toSelectItem(
  option: TitledListValue<string | number> | string | number
): TitledListValue<string | number> {
  return isTitledListValue(option) ? option : {title: capitalize(`${option}`), value: option}
}

const EMPTY_ITEM = {title: '', value: undefined}

const SelectInput = React.forwardRef(function SelectInput(
  props: Props<string | number>,
  forwardedRef: React.ForwardedRef<HTMLSelectElement | HTMLInputElement>
) {
  const {value, readOnly, markers, type, level, onChange, onFocus, presence} = props
  const items = useMemo(() => ((type.options?.list || []) as unknown[]).map(toSelectItem), [
    type.options?.list,
  ])
  const currentItem = items.find((item) => item.value === value)
  const isRadio = type.options && type.options.layout === 'radio'

  const errors = useMemo(
    () => markers.filter((marker) => marker.type === 'validation' && marker.level === 'error'),
    [markers]
  )

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
    (nextItem: TitledListValue<string | number>) => {
      onChange(
        PatchEvent.from(typeof nextItem.value === 'undefined' ? unset() : set(nextItem.value))
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

  const handleFocus = React.useCallback(() => {
    onFocus()
  }, [onFocus])

  const children = useMemo(() => {
    if (isRadio) {
      return (
        <RadioSelect
          inputId={inputId}
          items={items}
          value={currentItem}
          onChange={handleChange}
          direction={type.options.direction || 'vertical'}
          ref={forwardedRef as React.ForwardedRef<HTMLInputElement>}
          readOnly={readOnly}
          onFocus={handleFocus}
          customValidity={errors?.[0]?.item.message}
        />
      )
    }

    return (
      <Select
        onChange={handleSelectChange}
        onFocus={handleFocus}
        id={inputId}
        ref={forwardedRef as React.ForwardedRef<HTMLSelectElement>}
        readOnly={readOnly}
        customValidity={errors?.[0]?.item.message}
        value={optionValueFromItem(currentItem)}
      >
        {[EMPTY_ITEM, ...items].map((item, i) => (
          <option key={`${i - 1}`} value={i - 1}>
            {item.title}
          </option>
        ))}
      </Select>
    )
  }, [
    currentItem,
    errors,
    forwardedRef,
    handleChange,
    handleFocus,
    handleSelectChange,
    inputId,
    isRadio,
    items,
    optionValueFromItem,
    readOnly,
    type.options.direction,
  ])

  return (
    <FormField
      inputId={inputId}
      level={level}
      title={type.title}
      description={type.description}
      markers={markers}
      presence={presence}
    >
      {children}
    </FormField>
  )
})

export default SelectInput

const RadioSelect = forwardRef(function RadioSelect(
  props: {
    items: TitledListValue<string | number>[]
    value: TitledListValue<string | number>
    direction: 'horizontal' | 'vertical'
    readOnly: boolean
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
    readOnly: boolean
    value: TitledListValue<string | number>
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
