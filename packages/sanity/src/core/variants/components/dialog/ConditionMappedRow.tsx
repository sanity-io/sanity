import {TrashIcon} from '@sanity/icons/Trash'
import {Stack} from '@sanity/ui'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'
import {type NormalizedVariantConditionMap} from '../../util/normalizeVariantConditions'
import {ConditionMenuButton} from './ConditionMenuButton'
import {getConditionMappedRowOptions} from './getConditionMappedRowOptions'

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
  const {definition, keyOptions, selectedKeyOption, selectedValueOption, valueOptions} =
    getConditionMappedRowOptions({
      definitions,
      selectedKey,
      selectedValue,
      usedKeys,
    })

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
