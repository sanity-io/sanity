import {describe, expect, it} from 'vitest'

import {getVariantConditionIcon} from '../../../tool/detail/variantConditionIcons'
import {type NormalizedVariantConditionMap} from '../../../util/normalizeVariantConditions'
import {getConditionMappedRowOptions} from '../getConditionMappedRowOptions'

const audience: NormalizedVariantConditionMap = {
  name: 'audience',
  title: 'Audience',
  description: 'Who sees this',
  values: [
    {value: 'loyal', title: 'Loyal customers', description: 'Repeat visitors'},
    {value: 'new', title: 'New visitors'},
  ],
}

const locale: NormalizedVariantConditionMap = {
  name: 'locale',
  title: 'Locale',
  values: [{value: 'en-US', title: 'en-US'}],
}

const definitions = [audience, locale]

describe('getConditionMappedRowOptions', () => {
  it('maps the selected definition into key and value menu options', () => {
    const result = getConditionMappedRowOptions({
      definitions,
      selectedKey: 'audience',
      selectedValue: 'loyal',
      usedKeys: new Set(),
    })

    expect(result.definition).toEqual(audience)
    expect(result.keyOptions).toEqual([
      {
        value: 'audience',
        title: 'Audience',
        description: 'Who sees this',
        icon: getVariantConditionIcon('audience'),
      },
      {
        value: 'locale',
        title: 'Locale',
        description: undefined,
        icon: getVariantConditionIcon('locale'),
      },
    ])
    expect(result.valueOptions).toEqual([
      {value: 'loyal', title: 'Loyal customers', description: 'Repeat visitors'},
      {value: 'new', title: 'New visitors', description: undefined},
    ])
    expect(result.selectedKeyOption).toEqual(result.keyOptions[0])
    expect(result.selectedValueOption).toEqual(result.valueOptions[0])
  })

  it('hides keys used on other rows but keeps the current row key', () => {
    const result = getConditionMappedRowOptions({
      definitions,
      selectedKey: 'audience',
      selectedValue: '',
      usedKeys: new Set(['audience', 'locale']),
    })

    expect(result.keyOptions.map((option) => option.value)).toEqual(['audience'])
  })

  it('falls back to the stored pair when it is no longer configured', () => {
    const result = getConditionMappedRowOptions({
      definitions,
      selectedKey: 'legacy',
      selectedValue: 'retired',
      usedKeys: new Set(),
    })

    expect(result.definition).toBeUndefined()
    expect(result.valueOptions).toEqual([])
    expect(result.selectedKeyOption).toEqual({
      value: 'legacy',
      title: 'legacy',
      icon: getVariantConditionIcon('legacy'),
    })
    expect(result.selectedValueOption).toEqual({
      value: 'retired',
      title: 'retired',
    })
  })

  it('returns no selected options for an empty row', () => {
    const result = getConditionMappedRowOptions({
      definitions,
      selectedKey: '',
      selectedValue: '',
      usedKeys: new Set(),
    })

    expect(result.definition).toBeUndefined()
    expect(result.selectedKeyOption).toBeUndefined()
    expect(result.selectedValueOption).toBeUndefined()
    expect(result.valueOptions).toEqual([])
  })
})
