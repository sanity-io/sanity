import {describe, expect, it} from 'vitest'

import {toRegistryPath} from './toRegistryPath'

describe('toRegistryPath', () => {
  it('drops the root structure node id from a resolved document pane path', () => {
    expect(toRegistryPath('root;book;knut')).toBe('book;knut')
  })

  it('drops the root structure node id from a resolved list pane path', () => {
    expect(toRegistryPath('root;book')).toBe('book')
  })

  it('does not assume the root id is literally "root"', () => {
    expect(toRegistryPath('siteStructure;book;knut')).toBe('book;knut')
  })

  it('resolves the root pane alone to an empty path', () => {
    expect(toRegistryPath('root')).toBe('')
  })
})
