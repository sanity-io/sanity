import {type ArraySchemaType, isKeyedObject} from '@sanity/types'
import {Card, Checkbox, Flex, Grid} from '@sanity/ui'
import {resolveTypeName} from '@sanity/util/content'
import {useCallback, useMemo} from 'react'
import {Box} from 'ui5'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {IncompatibleItemType} from '../../../members/array/IncompatibleItemType'
import {set, unset} from '../../../patch/patch'
import {type ArrayOfObjectsInputProps} from '../../../types/inputProps'
import {DEFAULT_GRID_COLUMNS} from '../common/gridColumns'

function isEqual(item: any, otherItem: any): boolean {
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

function getMemberTypeOfItem(schemaType: ArraySchemaType, item: unknown) {
  return schemaType.of.find((memberType) => memberType.name === resolveTypeName(item))
}

const EMPTY_ARRAY: unknown[] = []

interface ObjectOption {
  _key?: string
}

/**
 * @hidden
 * Array of predefined object options input
 * Note: this input can handle only object values
 *
 *
 * @hidden
 * @beta
 */
export function ArrayOfObjectOptionsInput(props: ArrayOfObjectsInputProps) {
  const {
    renderPreview,
    schemaType,
    onChange,
    onPathFocus,
    value = [],
    readOnly,
    elementProps,
    path,
    changed,
  } = props

  const options = useMemo(
    () =>
      ((schemaType.options?.list || EMPTY_ARRAY) as ObjectOption[]).map((option, index) =>
        isKeyedObject(option) ? option : {...option, _key: `auto-generated-${index}`},
      ),
    [schemaType.options],
  )

  const handleChange = useCallback(
    (isChecked: boolean, changedOption: ObjectOption) => {
      if (!isChecked && isKeyedObject(changedOption)) {
        // This is an optimization that only works if list items are _keyed
        onChange(unset([{_key: changedOption._key}]))
        return
      }

      const nextValue = options.filter((option) =>
        isEqual(changedOption, option) ? isChecked : inArray(value, option),
      )

      onChange(nextValue.length > 0 ? set(nextValue) : unset())
    },
    [onChange, options, value],
  )

  const handleItemFocus = useCallback(
    (index: number) => {
      onPathFocus([index])
    },
    [onPathFocus],
  )

  const isGrid = schemaType.options?.layout === 'grid'
  // A checkbox grid never needs more tracks than it has options, so an explicit
  // `columns` narrows the grid but cannot stretch it past the option count.
  const gridColumns = Math.min(options.length, schemaType.options?.columns ?? DEFAULT_GRID_COLUMNS)

  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={false}>
      <Grid gap={2} gridTemplateColumns={isGrid ? gridColumns : 1} tabIndex={0} {...elementProps}>
        {options.map((option, index) => {
          const optionType = getMemberTypeOfItem(schemaType, option)
          const checked = inArray(value, option)
          const disabled = !optionType

          return (
            // oxlint-disable-next-line no-array-index-key
            <Flex key={index} align="center" as="label">
              <Checkbox
                disabled={disabled}
                checked={checked}
                onChange={(e) => handleChange(e.currentTarget.checked, option)}
                onFocus={() => handleItemFocus(index)}
                readOnly={readOnly}
              />
              <Box flexBasis="0%" flexGrow={1} marginLeft={2}>
                {optionType ? (
                  renderPreview({
                    layout: 'default',
                    schemaType: optionType,
                    value: option,
                  })
                ) : (
                  <Card tone="caution" radius={2}>
                    <IncompatibleItemType value={option} onFocus={() => handleItemFocus(index)} />
                  </Card>
                )}
              </Box>
            </Flex>
          )
        })}
      </Grid>
    </ChangeIndicator>
  )
}
