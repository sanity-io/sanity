import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'
import {AddIcon} from '@sanity/icons/Add'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {TrashIcon} from '@sanity/icons/Trash'
import {type Path} from '@sanity/mutate'
import {type PortableTextBlock} from '@sanity/types'
import {Inline, Skeleton, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {type ChangeEvent, useCallback, useId, useMemo, useState} from 'react'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useVariantConditions} from '../../hooks/useVariantConditions'
import {type VariantsLocaleResourceKeys, variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {type EditableSystemVariant} from '../../types'
import {
  getConditionKeyValidationError,
  getConditionValueValidationError,
} from '../../util/conditionValidation'
import {getVariantTitleValue} from '../../util/getIsVariantInvalid'
import {getPriorityInputValidationError} from '../../util/priorityValidation'
import {createPortableTextDescription} from '../../util/variantDefaults'
import {ConditionAutocompleteInput} from './ConditionAutocompleteInput'
import {ConditionMappedRow} from './ConditionMappedRow'
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
  onConditionValidityChange: (invalid: boolean) => void
  onPriorityValidityChange: (invalid: boolean) => void
  showValidation?: boolean
  value: EditableSystemVariant
}) {
  const {
    onChange,
    onConditionValidityChange,
    onPriorityValidityChange,
    showValidation = false,
    value,
  } = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const {data: variants} = useAllVariants()
  const conditionsConfig = useVariantConditions()
  const suggestionIndex = useMemo(() => buildConditionSuggestionIndex(variants), [variants])
  const mappedDefinitions =
    conditionsConfig.mode === 'mapped' && conditionsConfig.status === 'ready'
      ? conditionsConfig.definitions
      : []
  const titleId = useId()
  const descriptionId = useId()
  const priorityId = useId()
  // `conditions` is stored as an object, but object keys are awkward to edit live:
  // duplicates collapse and partial key edits like "far" -> "favorite" can lose data.
  // Keep rows locally while editing, then commit back once they serialize cleanly.
  const [conditionRows, setConditionRows] = useState(() => getConditionRows(value.conditions))
  const [priorityInput, setPriorityInput] = useState(() => String(value.priority))
  const conditionsValidation = useMemo(
    () => getConditionRowsValidation(conditionRows),
    [conditionRows],
  )
  const usedConditionKeys = useMemo(
    () => new Set(conditionRows.map((row) => row.key.trim()).filter(Boolean)),
    [conditionRows],
  )
  const hasUnusedMappedKeys = mappedDefinitions.some((item) => !usedConditionKeys.has(item.name))

  const hasTitle = Boolean(getVariantTitleValue(value))
  const showTitleError = showValidation && !hasTitle
  const priorityValidationError = getPriorityInputValidationError(priorityInput)
  const showPriorityError = showValidation && priorityValidationError

  const lastConditionRow = conditionRows[conditionRows.length - 1]
  const lastConditionComplete = Boolean(
    lastConditionRow && !hasConditionRowsValidationErrors(conditionsValidation),
  )
  const canAddCondition =
    lastConditionComplete && (conditionsConfig.mode === 'freeform' || hasUnusedMappedKeys)
  const addConditionDisabledHint =
    lastConditionComplete && conditionsConfig.mode === 'mapped' && !hasUnusedMappedKeys
      ? t('dialog.create.action.add-condition.none-remaining')
      : t('dialog.create.action.add-condition.disabled-hint')

  const updateConditionRows = useCallback(
    (nextRows: ConditionRow[]) => {
      const rows = nextRows.length ? nextRows : getConditionRows({})

      setConditionRows(rows)

      const nextRowsValidation = getConditionRowsValidation(rows)
      const nextRowsInvalid = hasConditionRowsValidationErrors(nextRowsValidation)
      onConditionValidityChange(nextRowsInvalid)

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

  const handlePriorityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.currentTarget.value
      const nextValue = event.currentTarget.valueAsNumber

      setPriorityInput(rawValue)
      const priorityValidationError = getPriorityInputValidationError(rawValue)
      onPriorityValidityChange(Boolean(priorityValidationError))

      if (Number.isFinite(nextValue)) {
        onChange(['priority'], nextValue)
      }
    },
    [onChange, onPriorityValidityChange],
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

  const handleMappedKeyChange = useCallback(
    (index: number, nextKey: string) => {
      const nextRows = conditionRows.map((row, rowIndex) =>
        rowIndex === index ? {...row, key: nextKey, value: ''} : row,
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
    <Stack gap={5}>
      <Stack gap={3}>
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

      <Stack gap={3}>
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

      <Stack gap={3}>
        <Inline gap={1}>
          <Text as="label" htmlFor={priorityId} size={1} weight="medium">
            {t('dialog.create.priority.label')}
          </Text>
          <Tooltip content={t('dialog.create.priority.tooltip')} placement="right">
            <HelpCircleIcon data-testid="variant-form-priority-help" />
          </Tooltip>
        </Inline>
        <TextInput
          aria-invalid={showPriorityError ? 'true' : undefined}
          customValidity={
            showPriorityError && priorityValidationError
              ? t(`dialog.create.priority.${priorityValidationError}`)
              : undefined
          }
          data-testid="variant-form-priority"
          fontSize={2}
          id={priorityId}
          inputMode="decimal"
          onChange={handlePriorityChange}
          type="number"
          value={priorityInput}
        />
        {showPriorityError && priorityValidationError && (
          <TextWithTone data-testid="variant-form-priority-error" size={1} tone="critical">
            {t(`dialog.create.priority.${priorityValidationError}`)}
          </TextWithTone>
        )}
      </Stack>

      <Stack gap={3}>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            {t('dialog.create.conditions.title')}
          </Text>
          <Text muted size={1}>
            {t('dialog.create.conditions.description')}
          </Text>
        </Stack>

        {conditionsConfig.mode === 'mapped' && conditionsConfig.status === 'loading' ? (
          <Stack data-testid="variant-form-conditions-loading" gap={2}>
            <Text muted size={1}>
              {t('dialog.create.conditions.loading')}
            </Text>
            <Skeleton animated radius={2} style={{height: 52}} />
            <Skeleton animated radius={2} style={{height: 52}} />
          </Stack>
        ) : null}

        {conditionsConfig.mode === 'mapped' && conditionsConfig.status === 'error' ? (
          <Stack data-testid="variant-form-conditions-error" gap={3}>
            <TextWithTone size={1} tone="critical">
              {t('dialog.create.conditions.error')}
            </TextWithTone>
            <Flex>
              <Button
                mode="ghost"
                onClick={conditionsConfig.retry}
                text={t('dialog.create.conditions.retry')}
                type="button"
              />
            </Flex>
          </Stack>
        ) : null}

        {conditionsConfig.mode === 'mapped' && conditionsConfig.status === 'ready' ? (
          <Stack gap={3}>
            {conditionRows.map((row, index) => (
              <ConditionMappedRow
                definitions={mappedDefinitions}
                disableRemove={isConditionRowEmpty(row) && conditionRows.length === 1}
                key={row.id}
                onClearKey={() => handleMappedKeyChange(index, '')}
                onClearValue={() => handleConditionChange(index, 'value', '')}
                onRemove={() => handleRemoveCondition(index)}
                onSelectKey={(nextKey) => handleMappedKeyChange(index, nextKey)}
                onSelectValue={(nextValue) => handleConditionChange(index, 'value', nextValue)}
                selectedKey={row.key}
                selectedValue={row.value}
                usedKeys={usedConditionKeys}
              />
            ))}
          </Stack>
        ) : null}

        {conditionsConfig.mode === 'freeform' ? (
          <Stack gap={2}>
            {conditionRows.map((row, index) => {
              const validation = conditionsValidation.get(index) ?? getEmptyConditionRowValidation()
              const valueValidation = showValidation ? validation.value : null
              const conditionValidationError = validation.key || valueValidation

              return (
                <Stack key={row.id} gap={2}>
                  <Flex alignItems="center" gap={2}>
                    <Box flexBasis="0%" flexGrow={1}>
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
                    <Box flexBasis="0%" flexGrow={1}>
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
                  {conditionValidationError ? (
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
                  ) : null}
                </Stack>
              )
            })}
          </Stack>
        ) : null}

        <Flex>
          <Button
            disabled={!canAddCondition}
            icon={AddIcon}
            mode="ghost"
            onClick={handleAddCondition}
            text={t('dialog.create.action.add-condition')}
            tooltipProps={canAddCondition ? null : {content: addConditionDisabledHint}}
            type="button"
          />
        </Flex>
      </Stack>
    </Stack>
  )
}
