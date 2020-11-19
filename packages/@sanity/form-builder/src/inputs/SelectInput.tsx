import React from 'react'
import {capitalize} from 'lodash'
import {isTitledListValue, TitledListValue} from '@sanity/types'
import FormField from 'part:@sanity/components/formfields/default'
import {Inline, Stack, Card, Text, Select, Flex, Radio, Box} from '@sanity/ui'
import {useId} from '@reach/auto-id'
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
  const {value, readOnly, markers, type, level, onChange, presence} = props
  const items = ((type.options?.list || []) as unknown[]).map(toSelectItem)
  const currentItem = items.find((item) => item.value === value)
  const isRadio = type.options && type.options.layout === 'radio'
  const validation = markers.filter((marker) => marker.type === 'validation')
  const errors = validation.filter((marker) => marker.level === 'error')

  const inputId = useId()
  const handleChange = React.useCallback(
    (nextItem) => {
      onChange(
        PatchEvent.from(typeof nextItem.value === 'undefined' ? unset() : set(nextItem.value))
      )
    },
    [onChange]
  )
  return (
    <FormField
      labelFor={inputId}
      markers={markers}
      level={level}
      label={type.title}
      description={type.description}
      presence={presence}
    >
      {isRadio ? (
        <RadioSelect
          items={items}
          value={currentItem}
          onChange={handleChange}
          direction={type.options.direction || 'vertical'}
          ref={forwardedRef as React.ForwardedRef<HTMLInputElement>}
          readOnly={readOnly}
          customValidity={errors?.[0]?.item.message}
        />
      ) : (
        <Select
          onChange={handleChange}
          id={inputId}
          ref={forwardedRef as React.ForwardedRef<HTMLSelectElement>}
          customValidity={errors?.[0]?.item.message}
        >
          {[EMPTY_ITEM, ...items].map((item, i) => (
            <option key={i} value={item.value}>
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
    customValidity?: string
  },
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {items, value, onChange, readOnly, customValidity, direction} = props

  const Flow = direction === 'horizontal' ? Inline : Stack
  return (
    <Card border padding={4} radius={1}>
      <Flow space={4} role="group">
        {items.map((item, index) => (
          <Flex key={index} as="label" align="center">
            <Radio
              ref={index === 0 ? forwardedRef : null}
              checked={value === item}
              onClick={() => onChange(item)}
              readOnly={readOnly}
              customValidity={customValidity}
            />
            <Box marginLeft={3}>
              <Text>{item.title}</Text>
            </Box>
          </Flex>
        ))}
      </Flow>
    </Card>
  )
})
