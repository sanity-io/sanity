import {getVariantConditionIcon} from '../../tool/detail/variantConditionIcons'
import {type NormalizedVariantConditionMap} from '../../util/normalizeVariantConditions'
import {type ConditionMenuOption} from './ConditionMenuButton'

/**
 * @internal
 */
export interface ConditionMappedRowOptions {
  definition: NormalizedVariantConditionMap | undefined
  keyOptions: ConditionMenuOption[]
  selectedKeyOption: ConditionMenuOption | undefined
  selectedValueOption: ConditionMenuOption | undefined
  valueOptions: ConditionMenuOption[]
}

/**
 * Builds the key/value menus for one mapped condition row.
 *
 * Keys already picked on other rows are omitted so a definition cannot target the same key twice.
 * A stored pair that is no longer configured still surfaces as a fallback option so the editor can
 * retarget it instead of the row going blank.
 *
 * @internal
 */
export function getConditionMappedRowOptions(input: {
  definitions: readonly NormalizedVariantConditionMap[]
  selectedKey: string
  selectedValue: string
  usedKeys: ReadonlySet<string>
}): ConditionMappedRowOptions {
  const {definitions, selectedKey, selectedValue, usedKeys} = input
  const definition = definitions.find((item) => item.name === selectedKey)

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

  return {definition, keyOptions, selectedKeyOption, selectedValueOption, valueOptions}
}
