import sanityImage from '../src/builder'
import should from 'should'
import {croppedImage} from './fixtures'

const urlFor = sanityImage().projectId('zp7mbokg').dataset('production')

function stripPath(url) {
  return url.split('?')[1]
}

const cases = [
  {
    name: 'constrains aspect ratio',
    url: urlFor.image(croppedImage()).size(100, 80).url(),
    expect: 'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?rect=200,300,1600,1280&w=100&h=80'
  },

  {
    name: 'skips hotspot/crop if crop mode specified',
    url: urlFor.image(croppedImage())
      .size(100, 80)
      .crop('center')
      .url(),
    expect: 'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?w=100&h=80&crop=center'
  },

  {
    name: 'skips hotspot/crop if focal point specified',
    url: urlFor.image(croppedImage())
      .size(100, 80)
      .focalPoint(10, 20)
      .url(),
    expect: 'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?fp-x=10&fp-x=20&w=100&h=80'
  },

  {
    name: 'all hotspot/crop-compatible params',
    url: stripPath(urlFor.image(croppedImage())
      .maxWidth(200)
      .minWidth(100)
      .maxHeight(300)
      .minHeight(150)
      .blur(50)
      .format('png')
      .invert(true)
      .orientation(90)
      .quality(50)
      .forceDownload('a.png')
      .flipHorizontal()
      .flipVertical()
      .fit('crop')
      .url()),
    // eslint-disable-next-line max-len
    expect: 'rect=200,300,1600,2400&flip=hv&fm=png&dl=a.png&blur=50&invert=true&or=90&min-h=150&max-h=300&min-w=100&max-w=200&q=50&fit=crop'
  },

  {
    name: 'all params',
    url: stripPath(urlFor.image(croppedImage())
      .focalPoint(10, 20)
      .maxWidth(200)
      .minWidth(100)
      .maxHeight(300)
      .minHeight(150)
      .blur(50)
      .rect(10, 20, 30, 40)
      .format('png')
      .invert(true)
      .orientation(90)
      .quality(50)
      .forceDownload('a.png')
      .flipHorizontal()
      .flipVertical()
      .fit('crop')
      .crop('center')
      .url()),
    // eslint-disable-next-line max-len
    expect: 'rect=10,20,30,40&fp-x=10&fp-x=20&flip=hv&fm=png&dl=a.png&blur=50&invert=true&or=90&min-h=150&max-h=300&min-w=100&max-w=200&q=50&fit=crop&crop=center'
  }
]

describe('builder', () => {
  cases.forEach(testCase => {
    it(testCase.name, () => {
      should(testCase.url).equal(testCase.expect)
    })
  })

  it('should throw on invalid fit mode', () => {
    should.throws(() => urlFor.image(croppedImage()).fit('moo'), /Invalid fit mode "moo"/)
  })

  it('should throw on invalid crop mode', () => {
    should.throws(() => urlFor.image(croppedImage()).crop('moo'), /Invalid crop mode "moo"/)
  })
})
