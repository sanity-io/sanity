import {describe, expect, it} from 'vitest'

import {collapseArrayItemsReducer, initialCollapseArrayItems} from '../configPropertyReducers'
import {type PluginOptions} from '../types'

describe('collapseArrayItemsReducer', () => {
  it('returns the initial value when no config is provided', () => {
    const config: PluginOptions = {name: 'test'}

    const result = collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems})

    expect(result).toEqual({enabled: true, limit: 4})
  })

  it('returns the value set by the root config', () => {
    const config: PluginOptions = {
      name: 'test',
      form: {arrays: {collapseItems: {enabled: false, limit: 10}}},
    }

    const result = collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems})

    expect(result).toEqual({enabled: false, limit: 10})
  })

  it('keeps the properties that a config does not set', () => {
    const config: PluginOptions = {
      name: 'test',
      form: {arrays: {collapseItems: {limit: 8}}},
    }

    const result = collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems})

    expect(result).toEqual({enabled: true, limit: 8})
  })

  it('returns the value set by a plugin', () => {
    const config: PluginOptions = {
      name: 'test',
      plugins: [{name: 'plugin-a', form: {arrays: {collapseItems: {enabled: false}}}}],
    }

    const result = collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems})

    expect(result).toEqual({enabled: false, limit: 4})
  })

  it('lets the root config override a plugin', () => {
    const config: PluginOptions = {
      name: 'test',
      form: {arrays: {collapseItems: {limit: 6}}},
      plugins: [{name: 'plugin-a', form: {arrays: {collapseItems: {limit: 2}}}}],
    }

    const result = collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems})

    expect(result).toEqual({enabled: true, limit: 6})
  })

  it('throws when the namespace is not an object', () => {
    const config = {
      name: 'test',
      form: {arrays: {collapseItems: true}},
    } as unknown as PluginOptions

    expect(() =>
      collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems}),
    ).toThrow('Expected `form.arrays.collapseItems` to be an object, but received boolean')
  })

  it('throws when enabled is not a boolean', () => {
    const config = {
      name: 'test',
      form: {arrays: {collapseItems: {enabled: 'yes'}}},
    } as unknown as PluginOptions

    expect(() =>
      collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems}),
    ).toThrow('Expected `form.arrays.collapseItems.enabled` to be a boolean, but received string')
  })

  it('throws when limit is not a number', () => {
    const config = {
      name: 'test',
      form: {arrays: {collapseItems: {limit: '4'}}},
    } as unknown as PluginOptions

    expect(() =>
      collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems}),
    ).toThrow('Expected `form.arrays.collapseItems.limit` to be a number, but received string')
  })

  it('throws when limit is not a positive integer', () => {
    const config: PluginOptions = {
      name: 'test',
      form: {arrays: {collapseItems: {limit: 0}}},
    }

    expect(() =>
      collapseArrayItemsReducer({config, initialValue: initialCollapseArrayItems}),
    ).toThrow('Expected `form.arrays.collapseItems.limit` to be a positive integer, but received 0')
  })
})
