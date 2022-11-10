import {isTitledListValue, StringOptions, TitledListValue} from '@sanity/types'
import {Select} from '@sanity/ui'
import capitalize from 'lodash/capitalize'
import React, {ChangeEvent, useCallback, useMemo} from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'

export function FieldInputStringList({
  onChange,
  options,
  value,
}: OperatorInputComponentProps<string>) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange(event.currentTarget.value)
    },
    [onChange]
  )

  const items = useMemo(() => (options as StringOptions)?.list?.map(toSelectItem), [options])

  return (
    <Select fontSize={1} onChange={handleChange} value={value ?? undefined}>
      <option hidden>Select...</option>
      {(items || []).map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <option key={index} value={item.value}>
          {item.title}
        </option>
      ))}
    </Select>
  )
}

function toSelectItem(
  option: TitledListValue<string | number> | string | number
): TitledListValue<string | number> {
  return isTitledListValue(option) ? option : {title: capitalize(`${option}`), value: option}
}
