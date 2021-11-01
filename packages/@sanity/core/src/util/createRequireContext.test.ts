import path from 'path'
import {createRequireContext} from './createRequireContext'

jest.mock('fs', () => {
  const {createFsFromVolume, Volume} = jest.requireActual('memfs')

  const mockVol = {
    './foo.js': 'module.exports = {}',
    './folder/nested.ts': 'module.exports = {}',
    './other.txt': -'',
    './no-match/something-else/another': '-',
  }

  return createFsFromVolume(Volume.fromJSON(mockVol, '/root'))
})

describe('createRequireContext', () => {
  it("returns a require.context function that behaves similar to webpack's require.context", () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      // intentionally blank
    })
    const requireContext = createRequireContext('/root', {
      require: jest.fn(() => 'mock from require'),
      resolve: jest.fn((request) => path.resolve('/root', request)),
    })

    const context = requireContext('/root', true, /\.(j|t)s$/)

    expect(typeof context).toBe('function')
    expect(typeof context.keys).toBe('function')
    expect(typeof context.resolve).toBe('function')

    expect(context('./foo')).toBe('mock from require')
    expect(context.resolve('./foo')).toBe('/root/foo')
    expect(context.resolve('./folder/nested')).toBe('/root/folder/nested')
    expect(context.keys()).toEqual(['./folder/nested.ts', './foo.js'])
    expect(context.id).toBe('')
    expect(consoleSpy.mock.calls).toEqual([
      ['Usage of `require.context` is deprecated and will break in a future release.'],
      ['`require.context` `context.id` is not supported.'],
    ])
    consoleSpy.mockRestore()
  })
})
