import {parseSource} from '../src/urlForImage'
import {imageWithNoCropSpecified, croppedImage} from './fixtures'

function compareParsedSource(outputSource, exptectedSource) {
  expect(typeof outputSource).toBe('object')
  expect(typeof outputSource.asset).toBe('object')
  expect(outputSource.asset._ref).toEqual(exptectedSource.asset._ref)
  expect(outputSource).toHaveProperty('crop')
  expect(outputSource).toHaveProperty('hotspot')
}

describe('parseSource', () => {
  test('does correctly parse full image object', () => {
    const parsedSource = parseSource(imageWithNoCropSpecified())
    compareParsedSource(parsedSource, imageWithNoCropSpecified())
  })

  test('does correctly parse asset object', () => {
    const parsedSource = parseSource(imageWithNoCropSpecified().asset._ref)
    compareParsedSource(parsedSource, imageWithNoCropSpecified())
  })

  test('does correctly parse image asset _ref', () => {
    const parsedSource = parseSource(imageWithNoCropSpecified().asset)
    compareParsedSource(parsedSource, imageWithNoCropSpecified())
  })

  test('does not overwrite crop or hotspot settings', () => {
    expect(parseSource(croppedImage())).toEqual(croppedImage())
  })

  test('returns null on non-image object', () => {
    expect(parseSource({})).toEqual(null)
  })
})
