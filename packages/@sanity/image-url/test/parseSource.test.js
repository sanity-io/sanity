import should from 'should'
import {parseSource} from '../src/urlForImage'
import {imageWithNoCropSpecified, croppedImage} from './fixtures'

function compareParsedSource(outputSource, exptectedSource) {
  should(outputSource).be.an.Object()
  should(outputSource.asset).be.an.Object()
  should(outputSource.asset._ref).be.eql(exptectedSource.asset._ref)
  should(outputSource).have.keys('crop', 'hotspot')
}

describe('[image-url] parseSource', () => {
  it('does correctly parse full image object', () => {
    const parsedSource = parseSource(imageWithNoCropSpecified())
    compareParsedSource(parsedSource, imageWithNoCropSpecified())
  })
  it('does correctly parse asset object', () => {
    const parsedSource = parseSource(imageWithNoCropSpecified().asset._ref)
    compareParsedSource(parsedSource, imageWithNoCropSpecified())
  })
  it('does correctly parse image asset _ref', () => {
    const parsedSource = parseSource(imageWithNoCropSpecified().asset)
    compareParsedSource(parsedSource, imageWithNoCropSpecified())
  })
  it('does not overwrite cropp or hotspot settings', () => {
    should(parseSource(croppedImage())).deepEqual(croppedImage())
  })
})
