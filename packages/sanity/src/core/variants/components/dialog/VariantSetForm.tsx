import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {type ChangeEvent, useCallback, useId, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../i18n'
import {type VariantsLocaleResourceKeys, variantsLocaleNamespace} from '../../i18n'
import {
  getConditionKeyValidationError,
  getConditionValueValidationError,
} from '../../util/conditionValidation'
import {type VariantSetDimension} from '../../util/variantSetPermutations'
import {type ValueChip, ValueChipsInput} from './ValueChipsInput'

interface DimensionRow {
  id: string
  key: string
  values: ValueChip[]
}

interface DimensionRowValidation {
  key: VariantsLocaleResourceKeys | null
  values: VariantsLocaleResourceKeys | null
}

function createEmptyRow(): DimensionRow {
  return {id: randomKey(12), key: '', values: []}
}

function seedRows(initialDimensions?: VariantSetDimension[]): DimensionRow[] {
  if (!initialDimensions || initialDimensions.length === 0) {
    return [createEmptyRow()]
  }

  return initialDimensions.map((dimension) => ({
    id: randomKey(12),
    key: dimension.key,
    values: dimension.values.map((value) => ({id: randomKey(12), value})),
  }))
}

function dedupeValues(chips: ValueChip[]): string[] {
  const seen = new Set<string>()
  const values: string[] = []
  for (const chip of chips) {
    const value = chip.value.trim()
    if (value && !seen.has(value)) {
      seen.add(value)
      values.push(value)
    }
  }
  return values
}

function getDimensionsFromRows(rows: DimensionRow[]): VariantSetDimension[] {
  return rows.map((row) => ({key: row.key.trim(), values: dedupeValues(row.values)}))
}

function getRowsValidation(rows: DimensionRow[]): Map<number, DimensionRowValidation> {
  const rowsValidation = new Map<number, DimensionRowValidation>()
  const seenKeys = new Set<string>()

  rows.forEach((row, index) => {
    const validation: DimensionRowValidation = {key: null, values: null}
    const key = row.key.trim()
    const values = dedupeValues(row.values)

    if (key) {
      if (seenKeys.has(key)) {
        validation.key = 'dialog.create.condition-key.duplicate'
      } else {
        seenKeys.add(key)
        const keyError = getConditionKeyValidationError(key)
        if (keyError === 'reserved') {
          validation.key = 'dialog.create.condition-key.reserved'
        } else if (keyError === 'invalid') {
          validation.key = 'dialog.create.condition-key.invalid'
        }
      }
    } else if (values.length > 0) {
      validation.key = 'dialog.create.condition-key.required'
    }

    if (key && values.length === 0) {
      validation.values = 'dialog.create-set.dimension-values.required'
    } else if (values.some((value) => getConditionValueValidationError(value) === 'invalid')) {
      validation.values = 'dialog.create.condition-value.invalid'
    }

    rowsValidation.set(index, validation)
  })

  return rowsValidation
}

function hasValidationErrors(validation: Map<number, DimensionRowValidation>): boolean {
  return Array.from(validation.values()).some(({key, values}) => key || values)
}

// Rotating example placeholders so each dimension row hints at a different kind of dimension,
// rather than repeating "market" and implying it's the only option. Cycled by row index.
const EXAMPLE_KEY_PLACEHOLDERS = [
  'dialog.create-set.example.0.key',
  'dialog.create-set.example.1.key',
  'dialog.create-set.example.2.key',
  'dialog.create-set.example.3.key',
] as const satisfies readonly VariantsLocaleResourceKeys[]

const EXAMPLE_VALUES_PLACEHOLDERS = [
  'dialog.create-set.example.0.values',
  'dialog.create-set.example.1.values',
  'dialog.create-set.example.2.values',
  'dialog.create-set.example.3.values',
] as const satisfies readonly VariantsLocaleResourceKeys[]

export function VariantSetForm(props: {
  name: string
  onNameChange: (name: string) => void
  onDimensionsChange: (dimensions: VariantSetDimension[]) => void
  onDimensionsValidityChange?: (invalid: boolean) => void
  showValidation?: boolean
  initialDimensions?: VariantSetDimension[]
}) {
  const {
    name,
    onNameChange,
    onDimensionsChange,
    onDimensionsValidityChange,
    showValidation = false,
    initialDimensions,
  } = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const nameId = useId()
  const [rows, setRows] = useState<DimensionRow[]>(() => seedRows(initialDimensions))
  const rowsValidation = useMemo(() => getRowsValidation(rows), [rows])

  const showNameError = showValidation && !name.trim()
  const lastRow = rows[rows.length - 1]
  const canAddDimension = Boolean(
    lastRow &&
    lastRow.key.trim() &&
    dedupeValues(lastRow.values).length > 0 &&
    !hasValidationErrors(rowsValidation),
  )

  const updateRows = useCallback(
    (nextRows: DimensionRow[]) => {
      const rowsToApply = nextRows.length ? nextRows : [createEmptyRow()]
      setRows(rowsToApply)
      onDimensionsChange(getDimensionsFromRows(rowsToApply))
      onDimensionsValidityChange?.(hasValidationErrors(getRowsValidation(rowsToApply)))
    },
    [onDimensionsChange, onDimensionsValidityChange],
  )

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onNameChange(event.currentTarget.value),
    [onNameChange],
  )

  const handleKeyChange = useCallback(
    (index: number, nextKey: string) => {
      updateRows(rows.map((row, rowIndex) => (rowIndex === index ? {...row, key: nextKey} : row)))
    },
    [rows, updateRows],
  )

  const handleValuesChange = useCallback(
    (index: number, values: ValueChip[]) => {
      updateRows(rows.map((row, rowIndex) => (rowIndex === index ? {...row, values} : row)))
    },
    [rows, updateRows],
  )

  const handleAddDimension = useCallback(() => {
    if (canAddDimension) {
      updateRows([...rows, createEmptyRow()])
    }
  }, [canAddDimension, rows, updateRows])

  const handleRemoveDimension = useCallback(
    (index: number) => {
      updateRows(rows.filter((_, rowIndex) => rowIndex !== index))
    },
    [rows, updateRows],
  )

  return (
    <Stack space={5}>
      <Stack space={3}>
        <Text as="label" htmlFor={nameId} size={1} weight="medium">
          {t('dialog.create-set.name.label')}
        </Text>
        <TextInput
          autoFocus
          aria-invalid={showNameError ? 'true' : undefined}
          customValidity={showNameError ? t('dialog.create-set.name.required') : undefined}
          data-testid="variant-set-form-name"
          fontSize={2}
          id={nameId}
          onChange={handleNameChange}
          placeholder={t('dialog.create-set.name.placeholder')}
          value={name}
        />
        {showNameError && (
          <TextWithTone data-testid="variant-set-form-name-error" size={1} tone="critical">
            {t('dialog.create-set.name.required')}
          </TextWithTone>
        )}
      </Stack>

      <Stack space={3}>
        <Stack space={2}>
          <Text size={1} weight="medium">
            {t('dialog.create-set.dimensions.title')}
          </Text>
          <Text muted size={1}>
            {t('dialog.create-set.dimensions.description')}
          </Text>
        </Stack>

        <Stack space={4}>
          {rows.map((row, index) => {
            const validation = rowsValidation.get(index) ?? {key: null, values: null}
            const validationError = validation.key || validation.values
            const example = index % EXAMPLE_KEY_PLACEHOLDERS.length

            return (
              <Stack key={row.id} space={2}>
                <Flex align="center" gap={2}>
                  <Box flex={1}>
                    <TextInput
                      aria-label={t('dialog.create-set.dimension-key.label')}
                      customValidity={validation.key ? t(validation.key) : undefined}
                      data-testid="variant-set-form-dimension-key"
                      fontSize={1}
                      onChange={(event) => handleKeyChange(index, event.currentTarget.value)}
                      placeholder={t(EXAMPLE_KEY_PLACEHOLDERS[example]!)}
                      value={row.key}
                    />
                  </Box>
                  <Button
                    disabled={rows.length === 1 && !row.key.trim() && row.values.length === 0}
                    icon={TrashIcon}
                    mode="bleed"
                    onClick={() => handleRemoveDimension(index)}
                    tone="critical"
                    tooltipProps={{content: t('dialog.create-set.remove-dimension')}}
                    type="button"
                  />
                </Flex>
                <Box paddingLeft={1}>
                  <ValueChipsInput
                    addPlaceholder={t(EXAMPLE_VALUES_PLACEHOLDERS[example]!)}
                    ariaLabel={t('dialog.create-set.dimension-values.label')}
                    chips={row.values}
                    onChange={(values) => handleValuesChange(index, values)}
                    removeLabel={t('dialog.create-set.remove-value')}
                  />
                </Box>
                {validationError && (
                  <TextWithTone
                    data-testid="variant-set-form-dimension-error"
                    size={1}
                    tone="critical"
                  >
                    {t(validationError)}
                  </TextWithTone>
                )}
              </Stack>
            )
          })}
        </Stack>

        <Flex>
          <Button
            disabled={!canAddDimension}
            icon={AddIcon}
            mode="ghost"
            onClick={handleAddDimension}
            text={t('dialog.create-set.action.add-dimension')}
            tooltipProps={
              canAddDimension
                ? null
                : {content: t('dialog.create-set.action.add-dimension.disabled-hint')}
            }
            type="button"
          />
        </Flex>
      </Stack>
    </Stack>
  )
}
