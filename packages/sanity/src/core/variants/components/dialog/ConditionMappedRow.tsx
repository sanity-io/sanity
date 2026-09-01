import {TrashIcon} from '@sanity/icons/Trash'
import {Stack, Text} from '@sanity/ui'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantConditionIcon} from '../../tool/detail/variantConditionIcons'
import {
  type NormalizedVariantConditionMap,
  type NormalizedVariantConditionValue,
} from '../../util/normalizeVariantConditions'
import {ConditionOptionCard} from './ConditionOptionCard'

interface ConditionMappedRowProps {
  definitions: NormalizedVariantConditionMap[]
  disableRemove: boolean
  onClearKey: () => void
  onClearValue: () => void
  onRemove: () => void
  onSelectKey: (key: string) => void
  onSelectValue: (value: string) => void
  selectedKey: string
  selectedValue: string
  usedKeys: ReadonlySet<string>
}

function getUnknownOption(value: string): NormalizedVariantConditionValue {
  return {value, title: value}
}

export function ConditionMappedRow(props: ConditionMappedRowProps): React.JSX.Element {
  const {
    definitions,
    disableRemove,
    onClearKey,
    onClearValue,
    onRemove,
    onSelectKey,
    onSelectValue,
    selectedKey,
    selectedValue,
    usedKeys,
  } = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const definition = definitions.find((item) => item.name === selectedKey)
  const selectedKeyOption = definition
    ? {title: definition.title, description: definition.description}
    : selectedKey
      ? {title: selectedKey}
      : undefined
  const selectedValueOption = definition
    ? definition.values.find((item) => item.value === selectedValue)
    : selectedValue
      ? getUnknownOption(selectedValue)
      : undefined
  const availableDefinitions = definitions.filter(
    (item) => item.name === selectedKey || !usedKeys.has(item.name),
  )

  const removeButton = (
    <Button
      disabled={disableRemove}
      icon={TrashIcon}
      mode="bleed"
      onClick={onRemove}
      tone="critical"
      tooltipProps={{content: t('dialog.create.remove-condition')}}
      type="button"
    />
  )

  if (selectedKey && selectedValue && selectedKeyOption && selectedValueOption) {
    return (
      <Flex alignItems="center" gap={2}>
        <Box flexBasis="0%" flexGrow={1}>
          <ConditionOptionCard
            description={selectedKeyOption.description}
            icon={getVariantConditionIcon(selectedKey)}
            onClick={onClearKey}
            testId="variant-form-condition-key-selected"
            title={selectedKeyOption.title}
          />
        </Box>
        <Box flexBasis="0%" flexGrow={1}>
          <ConditionOptionCard
            description={selectedValueOption.description}
            onClick={definition ? onClearValue : onClearKey}
            testId="variant-form-condition-value-selected"
            title={selectedValueOption.title}
          />
        </Box>
        {removeButton}
      </Flex>
    )
  }

  if (selectedKey && selectedKeyOption) {
    return (
      <Stack gap={3}>
        <Flex alignItems="flex-start" gap={2}>
          <Box flexGrow={1}>
            <ConditionOptionCard
              description={selectedKeyOption.description}
              icon={getVariantConditionIcon(selectedKey)}
              onClick={onClearKey}
              selected
              testId="variant-form-condition-key-selected"
              title={selectedKeyOption.title}
            />
          </Box>
          {removeButton}
        </Flex>
        {definition ? (
          <Stack gap={2}>
            <Text muted size={1}>
              {t('dialog.create.conditions.choose-value')}
            </Text>
            {definition.values.map((item) => (
              <ConditionOptionCard
                description={item.description}
                key={item.value}
                onClick={() => onSelectValue(item.value)}
                testId={`variant-form-condition-value-option-${item.value}`}
                title={item.title}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    )
  }

  return (
    <Stack gap={3}>
      <Flex alignItems="center" gap={2} justifyContent="space-between">
        <Text muted size={1}>
          {t('dialog.create.conditions.choose-key')}
        </Text>
        {removeButton}
      </Flex>
      <Stack gap={2}>
        {availableDefinitions.map((item) => (
          <ConditionOptionCard
            description={item.description}
            icon={getVariantConditionIcon(item.name)}
            key={item.name}
            onClick={() => onSelectKey(item.name)}
            testId={`variant-form-condition-key-option-${item.name}`}
            title={item.title}
          />
        ))}
      </Stack>
    </Stack>
  )
}
