import sanityImage from '../src/builder'
import {imageWithNoCropSpecified, croppedImage} from './fixtures'

const urlFor = sanityImage()
  .projectId('zp7mbokg')
  .dataset('production')

function stripPath(url) {
  return url.split('?')[1]
}

const cases = [
  {
    name: 'constrains aspect ratio',
    url: urlFor
      .image(croppedImage())
      .size(100, 80)
      .url(),
    expect:
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?rect=200,300,1600,1280&w=100&h=80'
  },

  {
    name: 'can be told to ignore hotspot',
    url: urlFor
      .image(croppedImage())
      .ignoreImageParams()
      .size(100, 80)
      .url(),
    expect:
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?w=100&h=80'
  },

  {
    name: 'toString() aliases url()',
    url: urlFor
      .image(croppedImage())
      .ignoreImageParams()
      .size(100, 80)
      .toString(),
    expect:
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?w=100&h=80'
  },

  {
    name: 'skips hotspot/crop if crop mode specified',
    url: urlFor
      .image(croppedImage())
      .size(100, 80)
      .crop('center')
      .url(),
    expect:
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?w=100&h=80&crop=center'
  },

  {
    name: 'skips hotspot/crop if focal point specified',
    url: urlFor
      .image(croppedImage())
      .size(100, 80)
      .focalPoint(10, 20)
      .url(),
    expect:
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?fp-x=10&fp-x=20&w=100&h=80'
  },

  {
    name: 'does not crop image with no crop/hotspot specified',
    url: urlFor
      .image(imageWithNoCropSpecified())
      .width(80)
      .url(),
    expect:
      'https://cdn.sanity.io/images/zp7mbokg/production/vK7bXJPEjVpL_C950gH1N73Zv14r7pYsbUdXl-4288x2848.jpg?w=80'
  },

  {
    name: 'does crop image with no crop/hotspot specified if aspect ratio is forced',
    url: urlFor
      .image(imageWithNoCropSpecified())
      .width(80)
      .height(80)
      .url(),
    expect:
      'https://cdn.sanity.io/images/zp7mbokg/production/vK7bXJPEjVpL_C950gH1N73Zv14r7pYsbUdXl-4288x2848.jpg?rect=720,0,2848,2848&w=80&h=80'
  },

  {
    name: 'can specify options with url params',
    url: urlFor
      .image(croppedImage())
      .withOptions({w: 320, h: 240})
      .url(),
    expect:
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?rect=200,300,1600,2400&w=320&h=240'
  },

  {
    name: 'all hotspot/crop-compatible params',
    url: stripPath(
      urlFor
        .image(croppedImage())
        .maxWidth(200)
        .minWidth(100)
        .maxHeight(300)
        .minHeight(150)
        .blur(50)
        .format('png')
        .invert(true)
        .orientation(90)
        .quality(50)
        .sharpen(7)
        .forceDownload('a.png')
        .flipHorizontal()
        .flipVertical()
        .fit('crop')
        .url()
    ),
    // eslint-disable-next-line max-len
    expect:
      'rect=200,300,1600,2400&flip=hv&fm=png&dl=a.png&blur=50&sharp=7&invert=true&or=90&min-h=150&max-h=300&min-w=100&max-w=200&q=50&fit=crop'
  },

  {
    name: 'all params',
    url: stripPath(
      urlFor
        .image(croppedImage())
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
        .url()
    ),
    // eslint-disable-next-line max-len
    expect:
      'rect=10,20,30,40&fp-x=10&fp-x=20&flip=hv&fm=png&dl=a.png&blur=50&invert=true&or=90&min-h=150&max-h=300&min-w=100&max-w=200&q=50&fit=crop&crop=center'
  }
]

describe('builder', () => {
  cases.forEach(testCase => {
    test(testCase.name, () => {
      expect(testCase.url).toBe(testCase.expect)
    })
  })

  test('should throw on invalid fit mode', () => {
    expect(() => urlFor.image(croppedImage()).fit('moo')).toThrowError(/Invalid fit mode "moo"/)
  })

  test('should throw on invalid crop mode', () => {
    expect(() => urlFor.image(croppedImage()).crop('moo')).toThrowError(/Invalid crop mode "moo"/)
  })
})
