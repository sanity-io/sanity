import {type ArraySchemaType} from '@sanity/types'
import {Checkbox, Flex, Grid, Text} from '@sanity/ui'
import {resolveTypeName} from '@sanity/util/content'
import startCase from 'lodash-es/startCase.js'
import {useMemo} from 'react'
import {Box} from 'ui5'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {set, unset} from '../../../patch/patch'
import {type ArrayOfPrimitivesInputProps} from '../../../types/inputProps'
import {IncompatibleItemType} from '../ArrayOfObjectsInput/List/IncompatibleItemType'
import {DEFAULT_GRID_COLUMNS} from '../common/gridColumns'

function isPrimitiveOption(option: unknown): option is NormalizedPrimitiveOption {
  return Boolean(option && typeof option === 'object' && 'title' in option && 'value' in option)
}

function normalizeOptions(options: unknown[]) {
  return options.map((option) => {
    if (isPrimitiveOption(option)) {
      return {
        title: option.title || startCase(String(option.value)),
        value: option.value,
      }
    }
    return {
      title: startCase(String(option)),
      value: option as string | number | boolean,
    }
  })
}

interface NormalizedPrimitiveOption {
  title: string
  value: string | boolean | number
}

function getMemberTypeOfItem(schemaType: ArraySchemaType, option: NormalizedPrimitiveOption) {
  return schemaType.of.find((memberType) => memberType.name === resolveTypeName(option.value))
}

/**
 * Array of predefined primitive options input
 * Note: this input can only handle primitive values
 *
 *
 * @hidden
 * @beta
 */
export function ArrayOfPrimitiveOptionsInput(props: ArrayOfPrimitivesInputProps) {
  const {
    schemaType,
    onChange,
    value = [],
    readOnly,
    path,
    changed,
    onIndexFocus,
    elementProps,
  } = props

  const options = useMemo(
    () => normalizeOptions(schemaType.options?.list || []),
    [schemaType.options?.list],
  )

  const handleChange = (isChecked: boolean, changedValue: string | boolean | number) => {
    const nextValue = options
      .map((option) => option.value)
      .filter((optionValue) =>
        // note: sparse arrays are not supported here, so multiple options with same value will all be checked
        optionValue === changedValue ? isChecked : value.includes(optionValue),
      )

    onChange(nextValue.length > 0 ? set(nextValue) : unset())
  }

  const isGrid = schemaType.options?.layout === 'grid'
  // A checkbox grid never needs more tracks than it has options, so an explicit
  // `columns` narrows the grid but cannot stretch it past the option count.
  const gridColumns = Math.min(options.length, schemaType.options?.columns ?? DEFAULT_GRID_COLUMNS)

  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={false}>
      <Grid gap={2} gridTemplateColumns={isGrid ? gridColumns : 1} {...elementProps}>
        {options.map((option, index) => {
          const optionType = getMemberTypeOfItem(schemaType, option)
          const checked = value.includes(option.value)

          const disabled = !optionType

          return (
            // oxlint-disable-next-line no-array-index-key
            <Flex key={index} align="center" as="label">
              <Checkbox
                disabled={disabled}
                checked={checked}
                onChange={(e) => handleChange(e.currentTarget.checked, option.value)}
                onFocus={() => onIndexFocus(index)}
                readOnly={readOnly}
              />

              <Box padding={2}>
                <Text>{option.title}</Text>
              </Box>

              {!optionType && (
                <IncompatibleItemType value={option} onFocus={() => onIndexFocus(index)} />
              )}
            </Flex>
          )
        })}
      </Grid>
    </ChangeIndicator>
  )
}
