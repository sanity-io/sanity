import {SelectIcon} from '@sanity/icons'
import {isTitledListValue, StringOptions, TitledListValue} from '@sanity/types'
import {Box, Button, Code, Flex, Menu, MenuButton, MenuItem, Stack, Text} from '@sanity/ui'
import {capitalize, uniq} from 'lodash'
import React, {useCallback, useId, useMemo} from 'react'
import {isNonNullable} from '../../../../../../../../util'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'

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
      padding={3}
      pressed={selected}
      selected={selected}
      tone="default"
    >
      <Flex align="center" justify="space-between" gap={3}>
        <Stack paddingRight={2} space={2}>
          <Text size={1} weight="regular">
            {title}
          </Text>
          {value && (
            <Code muted size={0}>
              {value}
            </Code>
          )}
        </Stack>
      </Flex>
    </MenuItem>
  )
}

export function FieldInputStringList({
  onChange,
  options,
  value,
}: OperatorInputComponentProps<number | string>) {
  const menuButtonId = useId()

  // Build list items
  const items = useMemo(() => {
    const lists = (options as StringOptions[]).map((o) => o.list)

    const selectOptions = lists
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
  }, [options])

  const handleClick = useCallback(
    (v: number | string) => {
      onChange(v)
    },
    [onChange]
  )

  return (
    <MenuButton
      button={
        <Button mode="ghost" padding={3}>
          <Flex align="center" gap={2} justify="space-between">
            <Text size={1} weight="regular">
              {value ? value : 'Select...'}
            </Text>
            <Box marginLeft={1}>
              <Text size={1}>
                <SelectIcon />
              </Text>
            </Box>
          </Flex>
        </Button>
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
      placement="bottom-start"
      popover={{portal: false, radius: 2}}
    />
  )
}

function toSelectItem(
  option: TitledListValue<string | number> | string | number
): TitledListValue<string | number> {
  return isTitledListValue(option) ? option : {title: capitalize(`${option}`), value: option}
}
