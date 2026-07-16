import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {useCallback, useMemo, useState} from 'react'
import {useAllVariants, useTranslation} from 'sanity'

import {ConditionAutocompleteInput} from '../../../../packages/sanity/src/core/variants/components/dialog/ConditionAutocompleteInput'
import {
  buildConditionSuggestionIndex,
  getConditionKeyOptions,
  getConditionValueOptions,
} from '../../../../packages/sanity/src/core/variants/components/dialog/conditionSuggestions'

interface ConditionRow {
  id: string
  key: string
  value: string
}

function getConditionRows(conditions: Record<string, string>): ConditionRow[] {
  const rows = Object.entries(conditions).map(([key, value]) => ({
    id: randomKey(12),
    key,
    value,
  }))

  return rows.length ? rows : [{id: randomKey(12), key: '', value: ''}]
}

function getConditionsFromRows(rows: ConditionRow[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((conditions, row) => {
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

function rowsHaveCompleteEntry(rows: ConditionRow[]): boolean {
  return rows.some((row) => row.key.trim() && row.value.trim())
}

/**
 * Condition key/value editor reused from the variants create/edit dialog. Commits complete
 * key/value pairs to the parent so the coffee shop can send them as `variantCondition` params.
 */
export function VariantConditionsPicker(props: {
  value: Record<string, string>
  onChange: (conditions: Record<string, string>) => void
}) {
  const {value, onChange} = props
  const {t} = useTranslation('variants')
  const {data: variants} = useAllVariants()
  const suggestionIndex = useMemo(() => buildConditionSuggestionIndex(variants), [variants])
  const [conditionRows, setConditionRows] = useState(() => getConditionRows(value))

  const updateConditionRows = useCallback(
    (nextRows: ConditionRow[]) => {
      const rows = nextRows.length ? nextRows : getConditionRows({})
      setConditionRows(rows)
      onChange(getConditionsFromRows(rows))
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

  const canAddCondition =
    conditionRows.length === 0 ||
    conditionRows.every((row) => isConditionRowEmpty(row) || (row.key.trim() && row.value.trim()))

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
    <Stack space={3}>
      <Stack space={2}>
        <Text size={1} weight="medium">
          {t('dialog.create.conditions.title')}
        </Text>
        <Text muted size={1}>
          Each complete key/value pair is sent as a separate <code>variantCondition=key:value</code>{' '}
          query parameter.
        </Text>
      </Stack>

      <Stack space={2}>
        {conditionRows.map((row, index) => (
          <Flex key={row.id} align="center" gap={2} wrap="wrap">
            <Box flex={1} style={{minWidth: '8rem'}}>
              <ConditionAutocompleteInput
                ariaLabel={t('dialog.create.condition-key.label')}
                onChange={(nextValue) => handleConditionChange(index, 'key', nextValue)}
                options={getConditionKeyOptions(suggestionIndex, conditionRows, index)}
                placeholder={t('dialog.create.condition-key.placeholder')}
                testId="coffee-demo-condition-key"
                value={row.key}
              />
            </Box>
            <Box flex={1} style={{minWidth: '8rem'}}>
              <ConditionAutocompleteInput
                ariaLabel={t('dialog.create.condition-value.label')}
                onChange={(nextValue) => handleConditionChange(index, 'value', nextValue)}
                options={getConditionValueOptions(suggestionIndex, row.key)}
                placeholder={t('dialog.create.condition-value.placeholder')}
                testId="coffee-demo-condition-value"
                value={row.value}
              />
            </Box>
            <Button
              disabled={isConditionRowEmpty(row) && conditionRows.length === 1}
              icon={TrashIcon}
              mode="bleed"
              onClick={() => handleRemoveCondition(index)}
              tone="critical"
              title={t('dialog.create.remove-condition')}
            />
          </Flex>
        ))}
      </Stack>

      <Flex align="center" gap={3} wrap="wrap">
        <Button
          disabled={!canAddCondition}
          icon={AddIcon}
          mode="ghost"
          onClick={handleAddCondition}
          text={t('dialog.create.action.add-condition')}
        />
        {!rowsHaveCompleteEntry(conditionRows) && (
          <Text size={1} muted>
            Add at least one complete condition to query variant content.
          </Text>
        )}
      </Flex>
    </Stack>
  )
}
