import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'
import {AddIcon, TrashIcon} from '@sanity/icons'
import {type Path} from '@sanity/mutate'
import {type PortableTextBlock} from '@sanity/types'
import {Box, Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {type ChangeEvent, useCallback, useId, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../i18n'
import {type VariantsLocaleResourceKeys, variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {type EditableSystemVariant} from '../../types'
import {
  getConditionKeyValidationError,
  getConditionValueValidationError,
} from '../../util/conditionValidation'
import {getVariantTitleValue} from '../../util/getIsVariantInvalid'
import {createPortableTextDescription} from '../../util/variantDefaults'
import {ConditionAutocompleteInput} from './ConditionAutocompleteInput'
import {
  buildConditionSuggestionIndex,
  getConditionKeyOptions,
  getConditionValueOptions,
} from './conditionSuggestions'

interface ConditionRow {
  id: string
  key: string
  value: string
}

interface ConditionRowValidation {
  key: VariantsLocaleResourceKeys | null
  value: VariantsLocaleResourceKeys | null
}

function getConditionRows(conditions: EditableSystemVariant['conditions']): ConditionRow[] {
  const rows = Object.entries(conditions).map(([key, value]) => ({
    id: randomKey(12),
    key,
    value,
  }))

  return rows.length ? rows : [{id: randomKey(12), key: '', value: ''}]
}

function getConditionsFromRows(rows: ConditionRow[]): EditableSystemVariant['conditions'] {
  return rows.reduce<EditableSystemVariant['conditions']>((conditions, row) => {
    const key = row.key.trim()
    const value = row.value.trim()

    if (key && value) {
      conditions[key] = value
    }

    return conditions
  }, {})
}

function isConditionRowEmpty(row: ConditionRow): boolean {
  return !row.key.trim() && !row.value.trim()
}

function getEmptyConditionRowValidation(): ConditionRowValidation {
  return {key: null, value: null}
}

function getConditionRowsValidation(rows: ConditionRow[]): Map<number, ConditionRowValidation> {
  const conditionRowsValidation = new Map<number, ConditionRowValidation>()
  const seenKeys = new Set<string>()

  rows.forEach((row, index) => {
    const validation: ConditionRowValidation = {key: null, value: null}
    const key = row.key.trim()
    const value = row.value.trim()

    if (key) {
      if (seenKeys.has(key)) {
        validation.key = 'dialog.create.condition-key.duplicate'
      } else {
        seenKeys.add(key)
      }

      const keyError = getConditionKeyValidationError(row.key)

      if (!validation.key && keyError === 'reserved') {
        validation.key = 'dialog.create.condition-key.reserved'
      } else if (!validation.key && keyError === 'invalid') {
        validation.key = 'dialog.create.condition-key.invalid'
      }
    } else if (value) {
      validation.key = 'dialog.create.condition-key.required'
    }

    const valueError = getConditionValueValidationError(row.value)

    if ((key || isConditionRowEmpty(row)) && valueError === 'empty') {
      validation.value = 'dialog.create.condition-value.required'
    } else if (valueError === 'invalid') {
      validation.value = 'dialog.create.condition-value.invalid'
    }

    conditionRowsValidation.set(index, validation)
  })

  return conditionRowsValidation
}

function hasConditionRowsValidationErrors(
  validation: Map<number, ConditionRowValidation>,
): boolean {
  return Array.from(validation.values()).some(({key, value}) => key || value)
}

function getPortableTextDescriptionValue(description?: PortableTextBlock[]): string {
  if (!Array.isArray(description) || !description.every(isPortableTextBlock)) {
    return ''
  }

  return toPlainText(description)
}

export type VariantFormChangeHandler = (path: Path, value: unknown) => void

export function VariantForm(props: {
  onChange: VariantFormChangeHandler
  onConditionValidityChange?: (invalid: boolean) => void
  showValidation?: boolean
  value: EditableSystemVariant
}) {
  const {onChange, onConditionValidityChange, showValidation = false, value} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const {data: variants} = useAllVariants()
  const suggestionIndex = useMemo(() => buildConditionSuggestionIndex(variants), [variants])
  const titleId = useId()
  const descriptionId = useId()
  // `conditions` is stored as an object, but object keys are awkward to edit live:
  // duplicates collapse and partial key edits like "far" -> "favorite" can lose data.
  // Keep rows locally while editing, then commit back once they serialize cleanly.
  const [conditionRows, setConditionRows] = useState(() => getConditionRows(value.conditions))
  const conditionsValidation = useMemo(
    () => getConditionRowsValidation(conditionRows),
    [conditionRows],
  )

  const hasTitle = Boolean(getVariantTitleValue(value))
  const showTitleError = showValidation && !hasTitle
  const lastConditionRow = conditionRows[conditionRows.length - 1]
  const canAddCondition = Boolean(
    lastConditionRow && !hasConditionRowsValidationErrors(conditionsValidation),
  )

  const updateConditionRows = useCallback(
    (nextRows: ConditionRow[]) => {
      const rows = nextRows.length ? nextRows : getConditionRows({})

      setConditionRows(rows)

      const nextRowsValidation = getConditionRowsValidation(rows)
      const nextRowsInvalid = hasConditionRowsValidationErrors(nextRowsValidation)
      onConditionValidityChange?.(nextRowsInvalid)

      if (nextRows.length === 0 || !nextRowsInvalid) {
        onChange(['conditions'], getConditionsFromRows(nextRows))
      }
    },
    [onChange, onConditionValidityChange],
  )

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(['metadata', 'title'], event.currentTarget.value)
    },
    [onChange],
  )

  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(
        ['metadata', 'description'],
        createPortableTextDescription(event.currentTarget.value),
      )
    },
    [onChange],
  )

  const handleConditionChange = useCallback(
    (index: number, field: 'key' | 'value', nextValue: string) => {
      const nextRows = conditionRows.map((row, rowIndex) =>
        rowIndex === index ? {...row, [field]: nextValue} : row,
      )

      updateConditionRows(nextRows)
    },
    [conditionRows, updateConditionRows],
  )

  const handleAddCondition = useCallback(() => {
    if (!canAddCondition) {
      return
    }

    updateConditionRows([...conditionRows, {id: randomKey(12), key: '', value: ''}])
  }, [canAddCondition, conditionRows, updateConditionRows])

  const handleRemoveCondition = useCallback(
    (index: number) => {
      const nextRows = conditionRows.filter((_, rowIndex) => rowIndex !== index)

      updateConditionRows(nextRows)
    },
    [conditionRows, updateConditionRows],
  )

  return (
    <Stack space={5}>
      <Stack space={3}>
        <Text as="label" htmlFor={titleId} size={1} weight="medium">
          {t('dialog.create.variant-title.label')}
        </Text>
        <TextInput
          autoFocus
          aria-invalid={showTitleError ? 'true' : undefined}
          customValidity={showTitleError ? t('dialog.create.variant-title.required') : undefined}
          data-testid="variant-form-title"
          fontSize={2}
          id={titleId}
          onChange={handleTitleChange}
          placeholder={t('dialog.create.variant-title.placeholder')}
          value={typeof value.metadata?.title === 'string' ? value.metadata.title : ''}
        />
        {showTitleError && (
          <TextWithTone data-testid="variant-form-title-error" size={1} tone="critical">
            {t('dialog.create.variant-title.required')}
          </TextWithTone>
        )}
      </Stack>

      <Stack space={3}>
        <Text as="label" htmlFor={descriptionId} size={1} weight="medium">
          {t('dialog.create.description.label')}
        </Text>
        <TextArea
          data-testid="variant-form-description"
          fontSize={1}
          id={descriptionId}
          onChange={handleDescriptionChange}
          placeholder={t('dialog.create.description.placeholder')}
          rows={3}
          value={getPortableTextDescriptionValue(value.metadata?.description)}
        />
      </Stack>

      <Stack space={3}>
        <Stack space={2}>
          <Text size={1} weight="medium">
            {t('dialog.create.conditions.title')}
          </Text>
          <Text muted size={1}>
            {t('dialog.create.conditions.description')}
          </Text>
        </Stack>

        <Stack space={2}>
          {conditionRows.map((row, index) => {
            const validation = conditionsValidation.get(index) ?? getEmptyConditionRowValidation()
            const valueValidation = showValidation ? validation.value : null
            const conditionValidationError = validation.key || valueValidation

            return (
              <Stack key={row.id} space={2}>
                <Flex align="center" gap={2}>
                  <Box flex={1}>
                    <ConditionAutocompleteInput
                      autoFocus={index > 0}
                      ariaLabel={t('dialog.create.condition-key.label')}
                      customValidity={validation.key ? t(validation.key) : undefined}
                      invalid={Boolean(validation.key)}
                      onChange={(nextValue) => handleConditionChange(index, 'key', nextValue)}
                      options={getConditionKeyOptions(suggestionIndex, conditionRows, index)}
                      placeholder={t('dialog.create.condition-key.placeholder')}
                      testId="variant-form-condition-key"
                      value={row.key}
                    />
                  </Box>
                  <Box flex={1}>
                    <ConditionAutocompleteInput
                      ariaLabel={t('dialog.create.condition-value.label')}
                      customValidity={valueValidation ? t(valueValidation) : undefined}
                      invalid={Boolean(valueValidation)}
                      onChange={(nextValue) => handleConditionChange(index, 'value', nextValue)}
                      options={getConditionValueOptions(suggestionIndex, row.key)}
                      placeholder={t('dialog.create.condition-value.placeholder')}
                      testId="variant-form-condition-value"
                      value={row.value}
                    />
                  </Box>
                  <Button
                    disabled={isConditionRowEmpty(row) && conditionRows.length === 1}
                    icon={TrashIcon}
                    mode="bleed"
                    onClick={() => handleRemoveCondition(index)}
                    tone="critical"
                    tooltipProps={{content: t('dialog.create.remove-condition')}}
                    type="button"
                  />
                </Flex>
                {conditionValidationError && (
                  <TextWithTone
                    data-testid={
                      validation.key
                        ? 'variant-form-condition-key-error'
                        : 'variant-form-condition-value-error'
                    }
                    size={1}
                    tone="critical"
                  >
                    {t(conditionValidationError)}
                  </TextWithTone>
                )}
              </Stack>
            )
          })}
        </Stack>

        <Flex>
          <Button
            disabled={!canAddCondition}
            icon={AddIcon}
            mode="ghost"
            onClick={handleAddCondition}
            text={t('dialog.create.action.add-condition')}
            tooltipProps={
              canAddCondition
                ? null
                : {content: t('dialog.create.action.add-condition.disabled-hint')}
            }
            type="button"
          />
        </Flex>
      </Stack>
    </Stack>
  )
}
