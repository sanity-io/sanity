import {Stack, Text} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {useCallback, useState} from 'react'

import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {type DimensionEdit} from '../../util/variantSetEdit'
import {type VariantSetDimension} from '../../util/variantSetPermutations'
import {type ValueChip, ValueChipsInput} from './ValueChipsInput'

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
    values: dimension.values.map((value) => ({id: randomKey(12), originalValue: value, value})),
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

  const handleValuesChange = useCallback(
    (keyIndex: number, chips: ValueChip[]) => {
      const nextRows = rows.map((row, index) => {
        if (index !== keyIndex) {
          return row
        }
        // Preserve each value's original for rename detection; chips added in the editor have none.
        const originalById = new Map(row.values.map((value) => [value.id, value.originalValue]))
        return {
          ...row,
          values: chips.map((chip) => ({
            id: chip.id,
            originalValue: originalById.get(chip.id) ?? null,
            value: chip.value,
          })),
        }
      })

      setRows(nextRows)
      onChange(toEdits(nextRows))
    },
    [rows, onChange],
  )

  return (
    <Stack space={4}>
      {rows.map((row, keyIndex) => (
        <Stack key={row.key} space={3}>
          <Text size={1} weight="semibold">
            {row.key}
          </Text>
          <ValueChipsInput
            addPlaceholder={t('dialog.edit-set.add-value')}
            ariaLabel={row.key}
            chips={row.values.map((value) => ({id: value.id, value: value.value}))}
            onChange={(chips) => handleValuesChange(keyIndex, chips)}
            removeLabel={t('dialog.edit-set.remove-value')}
          />
        </Stack>
      ))}
    </Stack>
  )
}
