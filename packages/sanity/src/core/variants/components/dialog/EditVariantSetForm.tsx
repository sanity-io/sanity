import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {type DimensionEdit} from '../../util/variantSetEdit'
import {type VariantSetDimension} from '../../util/variantSetPermutations'

interface ValueRow {
  id: string
  originalValue: string | null
  value: string
}

interface KeyRow {
  key: string
  values: ValueRow[]
}

function seedRows(dimensions: VariantSetDimension[]): KeyRow[] {
  return dimensions.map((dimension) => ({
    key: dimension.key,
    values: dimension.values.map((value) => ({
      id: randomKey(12),
      originalValue: value,
      value,
    })),
  }))
}

function toEdits(rows: KeyRow[]): DimensionEdit[] {
  return rows.map((row) => ({
    key: row.key,
    values: row.values.map(({originalValue, value}) => ({originalValue, value})),
  }))
}

export function EditVariantSetForm(props: {
  initialDimensions: VariantSetDimension[]
  onChange: (edits: DimensionEdit[]) => void
}) {
  const {initialDimensions, onChange} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const [rows, setRows] = useState<KeyRow[]>(() => seedRows(initialDimensions))

  const update = useCallback(
    (nextRows: KeyRow[]) => {
      setRows(nextRows)
      onChange(toEdits(nextRows))
    },
    [onChange],
  )

  const handleValueChange = useCallback(
    (keyIndex: number, valueId: string, nextValue: string) => {
      update(
        rows.map((row, index) =>
          index === keyIndex
            ? {
                ...row,
                values: row.values.map((value) =>
                  value.id === valueId ? {...value, value: nextValue} : value,
                ),
              }
            : row,
        ),
      )
    },
    [rows, update],
  )

  const handleRemoveValue = useCallback(
    (keyIndex: number, valueId: string) => {
      update(
        rows.map((row, index) =>
          index === keyIndex
            ? {...row, values: row.values.filter((value) => value.id !== valueId)}
            : row,
        ),
      )
    },
    [rows, update],
  )

  const handleAddValue = useCallback(
    (keyIndex: number) => {
      update(
        rows.map((row, index) =>
          index === keyIndex
            ? {...row, values: [...row.values, {id: randomKey(12), originalValue: null, value: ''}]}
            : row,
        ),
      )
    },
    [rows, update],
  )

  const keySpacing = useMemo(() => (rows.length > 1 ? 4 : 3), [rows.length])

  return (
    <Stack space={keySpacing}>
      {rows.map((row, keyIndex) => (
        <Stack key={row.key} space={3}>
          <Text size={1} weight="semibold">
            {row.key}
          </Text>
          <Stack space={2}>
            {row.values.map((value) => (
              <Flex key={value.id} align="center" gap={2}>
                <Box flex={1}>
                  <TextInput
                    aria-label={row.key}
                    data-testid="edit-set-value-input"
                    fontSize={1}
                    onChange={(event) =>
                      handleValueChange(keyIndex, value.id, event.currentTarget.value)
                    }
                    value={value.value}
                  />
                </Box>
                <Button
                  data-testid="edit-set-remove-value"
                  disabled={row.values.length === 1}
                  icon={TrashIcon}
                  mode="bleed"
                  onClick={() => handleRemoveValue(keyIndex, value.id)}
                  tone="critical"
                  tooltipProps={{content: t('dialog.edit-set.remove-value')}}
                  type="button"
                />
              </Flex>
            ))}
          </Stack>
          <Flex>
            <Button
              data-testid="edit-set-add-value"
              icon={AddIcon}
              mode="ghost"
              onClick={() => handleAddValue(keyIndex)}
              text={t('dialog.edit-set.add-value')}
              type="button"
            />
          </Flex>
        </Stack>
      ))}
    </Stack>
  )
}
