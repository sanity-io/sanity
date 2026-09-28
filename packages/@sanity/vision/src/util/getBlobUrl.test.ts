import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {canEncodeCsv, getCsvBlobUrl} from './getBlobUrl'

const csvMocks = vi.hoisted(() => ({
  json2csv: vi.fn((items: unknown[]) => items.map((item) => JSON.stringify(item)).join('\n')),
}))

vi.mock('json-2-csv', () => ({json2csv: csvMocks.json2csv}))

describe('getBlobUrl', () => {
  const objectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
  const revokeUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
  let created = 0
  const createObjectURL = vi.fn(() => `blob:${++created}`)
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {value: createObjectURL, configurable: true})
    Object.defineProperty(URL, 'revokeObjectURL', {value: revokeObjectURL, configurable: true})
  })

  afterEach(() => {
    if (objectUrl) Object.defineProperty(URL, 'createObjectURL', objectUrl)
    else Reflect.deleteProperty(URL, 'createObjectURL')
    if (revokeUrl) Object.defineProperty(URL, 'revokeObjectURL', revokeUrl)
    else Reflect.deleteProperty(URL, 'revokeObjectURL')
  })

  it('encodes a result once, keeps its URL for the same result and replaces it for another', () => {
    const first = [{title: 'a'}]
    const url = getCsvBlobUrl(first)
    expect(url).toBe('blob:1')
    expect(csvMocks.json2csv).toHaveBeenCalledTimes(1)

    // The same result again: nothing is encoded, the URL still stands
    expect(getCsvBlobUrl(first)).toBe('blob:1')
    expect(csvMocks.json2csv).toHaveBeenCalledTimes(1)

    // Equal content in another object is encoded to compare, but keeps the URL
    expect(getCsvBlobUrl([{title: 'a'}])).toBe('blob:1')
    expect(csvMocks.json2csv).toHaveBeenCalledTimes(2)
    expect(revokeObjectURL).not.toHaveBeenCalled()

    // Other content replaces the file and revokes the previous URL
    expect(getCsvBlobUrl([{title: 'b'}])).toBe('blob:2')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1')
  })

  it('has no file for a result the encoder yields nothing for', () => {
    csvMocks.json2csv.mockReturnValueOnce('')
    expect(getCsvBlobUrl([1, 2])).toBeUndefined()
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('tells from the shape whether a CSV can be made', () => {
    expect(canEncodeCsv([{a: 1}])).toBe(true)
    expect(canEncodeCsv({a: 1})).toBe(true)
    expect(canEncodeCsv([1, {a: 1}])).toBe(true)
    expect(canEncodeCsv([1, 2, 3])).toBe(false)
    expect(canEncodeCsv(['a'])).toBe(false)
    expect(canEncodeCsv([null])).toBe(false)
    expect(canEncodeCsv([[1, 2]])).toBe(false)
    expect(canEncodeCsv([])).toBe(false)
    expect(canEncodeCsv(42)).toBe(false)
    expect(canEncodeCsv(null)).toBe(false)
  })
})
