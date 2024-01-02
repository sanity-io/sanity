import {getStructureNodeId} from '../getStructureNodeId'

describe('getStructureNodeId', () => {
  it('should return the id if provided', () => {
    expect(getStructureNodeId('foo', 'bar')).toBe('bar')
  })

  it('should return a camelCased id if the title contains space', () => {
    expect(getStructureNodeId('foo bar')).toBe('fooBar')
  })

  it('should return a camelCased id if the title contains a disallowed character', () => {
    expect(getStructureNodeId('foo bar!')).toBe('fooBar')
  })

  it('should return a camelCased id if the title contains a cyrillic characters', () => {
    expect(getStructureNodeId('Настройки открыто')).toBe('nastroikiOtkryto')
  })
})
