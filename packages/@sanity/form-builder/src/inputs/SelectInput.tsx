import React from 'react'
import {capitalize} from 'lodash'
import {useId} from '@reach/auto-id'
import {isTitledListValue, TitledListValue} from '@sanity/types'
import {Inline, Stack, Card, Text, Select, Flex, Radio, Box} from '@sanity/ui'
import {FormField} from '@sanity/base/components'
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
  const items = ((type.options?.list || []) as unknown[]).map(toSelectItem)
  const currentItem = items.find((item) => item.value === value)
  const isRadio = type.options && type.options.layout === 'radio'
  const validation = markers.filter((marker) => marker.type === 'validation')
  const errors = validation.filter((marker) => marker.level === 'error')

  const itemFromOptionValue = (optionValue) => {
    const index = Number(optionValue)

    return items[index]
  }

  const optionValueFromItem = (item) => {
    return String(items.indexOf(item))
  }

  const inputId = useId()
  const handleChange = React.useCallback(
    (nextItem: TitledListValue<string | number>) => {
      onChange(
        PatchEvent.from(typeof nextItem.value === 'undefined' ? unset() : set(nextItem.value))
      )
    },
    [onChange]
  )

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextItem = itemFromOptionValue(event.currentTarget.value)

    if (!nextItem) {
      handleChange(EMPTY_ITEM)
      return
    }

    handleChange(nextItem)
  }

  const handleFocus = React.useCallback(() => {
    onFocus()
  }, [onFocus])

  return (
    <FormField
      inputId={inputId}
      level={level}
      title={type.title}
      description={type.description}
      __unstable_markers={markers}
      __unstable_presence={presence}
    >
      {isRadio ? (
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
      ) : (
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
      )}
    </FormField>
  )
})

export default SelectInput

const RadioSelect = React.forwardRef(function RadioSelect(
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
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {items, value, onChange, onFocus, readOnly, customValidity, direction, inputId} = props

  const Layout = direction === 'horizontal' ? Inline : Stack
  return (
    <Card border padding={3} radius={1}>
      <Layout space={3} role="group">
        {items.map((item, index) => (
          <Flex key={index} as="label" align="center">
            <Radio
              ref={index === 0 ? forwardedRef : null}
              checked={value === item}
              onChange={() => onChange(item)}
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
        ))}
      </Layout>
    </Card>
  )
})
