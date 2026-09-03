import {TrashIcon} from '@sanity/icons/Trash'
import {Stack} from '@sanity/ui'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantConditionIcon} from '../../tool/detail/variantConditionIcons'
import {type NormalizedVariantConditionMap} from '../../util/normalizeVariantConditions'
import {ConditionMenuButton, type ConditionMenuOption} from './ConditionMenuButton'

interface ConditionMappedRowProps {
  definitions: readonly NormalizedVariantConditionMap[]
  disableRemove: boolean
  keyError?: string | null
  loading?: boolean
  onRemove: () => void
  onSelectKey: (key: string) => void
  onSelectValue: (value: string) => void
  selectedKey: string
  selectedValue: string
  usedKeys: ReadonlySet<string>
  valueError?: string | null
}

export function ConditionMappedRow(props: ConditionMappedRowProps): React.JSX.Element {
  const {
    definitions,
    disableRemove,
    keyError,
    loading = false,
    onRemove,
    onSelectKey,
    onSelectValue,
    selectedKey,
    selectedValue,
    usedKeys,
    valueError,
  } = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const definition = definitions.find((item) => item.name === selectedKey)

  // Keys picked on other rows are hidden here, so one definition cannot target the same key twice.
  const keyOptions: ConditionMenuOption[] = definitions
    .filter((item) => item.name === selectedKey || !usedKeys.has(item.name))
    .map((item) => ({
      value: item.name,
      title: item.title,
      description: item.description,
      icon: getVariantConditionIcon(item.name),
    }))
  const valueOptions: ConditionMenuOption[] =
    definition?.values.map((item) => ({
      value: item.value,
      title: item.title,
      description: item.description,
    })) ?? []

  // A stored pair that is no longer configured still renders as-is (in a critical tone) so the
  // editor can see what to retarget, rather than silently disappearing from the form.
  const selectedKeyOption = selectedKey
    ? (keyOptions.find((item) => item.value === selectedKey) ?? {
        value: selectedKey,
        title: selectedKey,
        icon: getVariantConditionIcon(selectedKey),
      })
    : undefined
  const selectedValueOption = selectedValue
    ? (valueOptions.find((item) => item.value === selectedValue) ?? {
        value: selectedValue,
        title: selectedValue,
      })
    : undefined

  const mappedError = keyError || valueError

  return (
    <Stack gap={2}>
      <Flex alignItems="center" gap={2}>
        <Box flexBasis="0%" flexGrow={1}>
          <ConditionMenuButton
            invalid={Boolean(keyError)}
            loading={loading}
            onSelect={onSelectKey}
            options={keyOptions}
            placeholder={
              loading
                ? t('dialog.create.conditions.loading')
                : t('dialog.create.conditions.choose-key')
            }
            selected={selectedKeyOption}
            testId="variant-form-condition-key"
          />
        </Box>
        <Box flexBasis="0%" flexGrow={1}>
          <ConditionMenuButton
            disabled={!definition}
            invalid={Boolean(valueError)}
            onSelect={onSelectValue}
            options={valueOptions}
            placeholder={t('dialog.create.conditions.choose-value')}
            selected={selectedValueOption}
            testId="variant-form-condition-value"
          />
        </Box>
        <Button
          disabled={disableRemove}
          icon={TrashIcon}
          mode="bleed"
          onClick={onRemove}
          tone="critical"
          tooltipProps={{content: t('dialog.create.remove-condition')}}
          type="button"
        />
      </Flex>
      {mappedError ? (
        <TextWithTone data-testid="variant-form-condition-mismatch" size={1} tone="critical">
          {mappedError}
        </TextWithTone>
      ) : null}
    </Stack>
  )
}
