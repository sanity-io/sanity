import {AddIcon, TrashIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {type ChangeEvent, useCallback, useId, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {type EditableSystemVariant} from '../../types'
import {getVariantTitleValue} from '../../util/getIsVariantInvalid'
import {createPortableTextDescription} from '../../util/variantDefaults'

interface ConditionRow {
  id: string
  key: string
  value: string
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

function isConditionRowComplete(row: ConditionRow): boolean {
  return Boolean(row.key.trim() && row.value.trim())
}

function getDuplicateConditionKeyIndexes(rows: ConditionRow[]): Set<number> {
  const seenKeys = new Set<string>()
  const duplicateIndexes = new Set<number>()

  rows.forEach((row, index) => {
    const key = row.key.trim()

    if (!key) {
      return
    }

    if (seenKeys.has(key)) {
      duplicateIndexes.add(index)
    } else {
      seenKeys.add(key)
    }
  })

  return duplicateIndexes
}

function getConditionRowsInvalid(rows: ConditionRow[]): boolean {
  return (
    rows.some((row) => !isConditionRowComplete(row)) ||
    getDuplicateConditionKeyIndexes(rows).size > 0
  )
}

export function VariantForm(props: {
  onChange: (variant: EditableSystemVariant) => void
  onConditionValidityChange?: (invalid: boolean) => void
  showValidation?: boolean
  value: EditableSystemVariant
}) {
  const {onChange, onConditionValidityChange, showValidation = false, value} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const titleId = useId()
  const descriptionId = useId()
  const [titleTouched, setTitleTouched] = useState(false)
  // `conditions` is stored as an object, but object keys are awkward to edit live:
  // duplicates collapse and partial key edits like "far" -> "favorite" can lose data.
  // Keep rows locally while editing, then commit back once they serialize cleanly.
  const [conditionRows, setConditionRows] = useState(() => getConditionRows(value.conditions))
  const duplicateConditionKeyIndexes = useMemo(
    () => getDuplicateConditionKeyIndexes(conditionRows),
    [conditionRows],
  )

  const hasTitle = Boolean(getVariantTitleValue(value))
  const showTitleError = (showValidation || titleTouched) && !hasTitle
  const lastConditionRow = conditionRows[conditionRows.length - 1]
  const canAddCondition = Boolean(
    lastConditionRow &&
    isConditionRowComplete(lastConditionRow) &&
    duplicateConditionKeyIndexes.size === 0,
  )

  const updateConditionRows = useCallback(
    (nextRows: ConditionRow[]) => {
      const rows = nextRows.length ? nextRows : getConditionRows({})

      setConditionRows(rows)

      const nextRowsInvalid = getConditionRowsInvalid(rows)
      onConditionValidityChange?.(nextRowsInvalid)

      if (nextRows.length === 0 || !nextRowsInvalid) {
        onChange({
          ...value,
          conditions: getConditionsFromRows(nextRows),
        })
      }
    },
    [onChange, onConditionValidityChange, value],
  )

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...value,
        metadata: {
          ...value.metadata,
          title: event.currentTarget.value,
        },
      })
    },
    [onChange, value],
  )

  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange({
        ...value,
        metadata: {
          ...value.metadata,
          description: createPortableTextDescription(event.currentTarget.value),
        },
      })
    },
    [onChange, value],
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
          onBlur={() => setTitleTouched(true)}
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
          {conditionRows.map((row, index) => (
            <Stack key={row.id} space={2}>
              <Flex align="center" gap={2}>
                <Box flex={1}>
                  <TextInput
                    autoFocus={index > 0}
                    aria-invalid={duplicateConditionKeyIndexes.has(index) ? 'true' : undefined}
                    aria-label={t('dialog.create.condition-key.label')}
                    customValidity={
                      duplicateConditionKeyIndexes.has(index)
                        ? t('dialog.create.condition-key.duplicate')
                        : undefined
                    }
                    data-testid="variant-form-condition-key"
                    fontSize={1}
                    onChange={(event) =>
                      handleConditionChange(index, 'key', event.currentTarget.value)
                    }
                    placeholder={t('dialog.create.condition-key.placeholder')}
                    value={row.key}
                  />
                </Box>
                <Box flex={1}>
                  <TextInput
                    aria-label={t('dialog.create.condition-value.label')}
                    data-testid="variant-form-condition-value"
                    fontSize={1}
                    onChange={(event) =>
                      handleConditionChange(index, 'value', event.currentTarget.value)
                    }
                    placeholder={t('dialog.create.condition-value.placeholder')}
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
              {duplicateConditionKeyIndexes.has(index) && (
                <TextWithTone
                  data-testid="variant-form-condition-key-error"
                  size={1}
                  tone="critical"
                >
                  {t('dialog.create.condition-key.duplicate')}
                </TextWithTone>
              )}
            </Stack>
          ))}
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
