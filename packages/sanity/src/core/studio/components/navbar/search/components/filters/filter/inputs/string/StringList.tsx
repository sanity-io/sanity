import {SelectIcon} from '@sanity/icons'
import {isTitledListValue, StringOptions, TitledListValue} from '@sanity/types'
import {Menu, MenuButton} from '@sanity/ui'
import {capitalize, uniq} from 'lodash'
import React, {useCallback, useId, useMemo} from 'react'
import {useSchema} from '../../../../../../../../../hooks'
import {isNonNullable} from '../../../../../../../../../util'
import {useSearchState} from '../../../../../contexts/search/useSearchState'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {getSchemaField} from '../../../../../utils/getSchemaField'
import {Button, MenuItem} from '../../../../../../../../../../ui'

interface TitledListValueGroup extends Omit<TitledListValue<number | string>, 'title'> {
  title: (number | string)[]
}

function CustomMenuItem({
  onClick,
  selected,
  title,
  value,
}: {
  onClick: (value: number | string) => void
  selected: boolean
  title: string
  value: number | string
}) {
  const handleClick = useCallback(() => onClick(value), [onClick, value])

  return (
    <MenuItem
      onClick={handleClick}
      pressed={selected}
      tone="default"
      text={title}
      subtitle={value ? `${value}` : undefined}
    />
  )
}

export function SearchFilterStringListInput({
  fieldDefinition,
  onChange,
  value,
}: OperatorInputComponentProps<number | string>) {
  const menuButtonId = useId()

  const {
    state: {documentTypesNarrowed},
  } = useSearchState()
  const schema = useSchema()

  // Build list items
  const items = useMemo(() => {
    if (!fieldDefinition) {
      return []
    }

    const options = fieldDefinition.documentTypes
      .filter((d) => documentTypesNarrowed.includes(d))
      .map((type) => {
        const schemaType = schema.get(type)
        if (schemaType) {
          const field = getSchemaField(schemaType, fieldDefinition.fieldPath)
          return field?.type.options as StringOptions
        }
        return null
      })
      .filter(isNonNullable)

    const selectOptions = options
      .map((o) => o.list)
      .flatMap((list) => list?.map((l) => toSelectItem(l)))
      .filter(isNonNullable)

    return selectOptions.reduce<TitledListValueGroup[]>((acc, val) => {
      const prevIndex = acc.findIndex((v) => v.value === val?.value)
      if (prevIndex > -1) {
        const prevValue = acc[prevIndex]
        acc[prevIndex] = {
          ...acc[prevIndex],
          title: uniq([...prevValue.title, val.title]).sort(),
        }
      } else {
        acc.push({
          ...val,
          title: [val.title],
        })
      }
      return acc
    }, [])
  }, [documentTypesNarrowed, fieldDefinition, schema])

  const handleClick = useCallback(
    (v: number | string) => {
      onChange(v)
    },
    [onChange],
  )

  return (
    <MenuButton
      button={
        <Button mode="ghost" iconRight={SelectIcon} text={value ? String(value) : 'Select...'} />
      }
      id={menuButtonId || ''}
      menu={
        <Menu>
          {items.map((item, index) => (
            <CustomMenuItem
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              onClick={handleClick}
              selected={item.value === value}
              title={item.title.join(', ')}
              value={item.value || ''}
            />
          ))}
        </Menu>
      }
      popover={{
        constrainSize: true,
        placement: 'bottom-start',
        portal: false,
        radius: 2,
      }}
    />
  )
}

function toSelectItem(
  option: TitledListValue<string | number> | string | number,
): TitledListValue<string | number> {
  return isTitledListValue(option) ? option : {title: capitalize(`${option}`), value: option}
}
