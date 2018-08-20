import sanityImage from '../src/builder'
import {croppedImage, imageWithNoCropSpecified, noHotspotImage} from './fixtures'

const urlFor = sanityImage()
  .projectId('zp7mbokg')
  .dataset('production')

function stripPath(url) {
  return url.split('?')[1]
}

const cases = [
  {
    name: 'handles hotspot but no crop',
    url: urlFor
      .image({
        _type: 'image',
        asset: {
          _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg',
          _type: 'reference'
        },
        hotspot: {
          height: 0.3,
          width: 0.3,
          x: 0.3,
          y: 0.3
        }
      })
      .url()
  },
  {
    name: 'handles crop but no hotspot',
    url: urlFor
      .image({
        _type: 'image',
        asset: {
          _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg',
          _type: 'reference'
        },
        crop: {
          bottom: 0.1,
          left: 0.1,
          right: 0.1,
          top: 0.1
        }
      })
      .url()
  },
  {
    name: 'constrains aspect ratio',
    url: urlFor
      .image(croppedImage())
      .size(100, 80)
      .url()
  },

  {
    name: 'can be told to ignore hotspot',
    url: urlFor
      .image(croppedImage())
      .ignoreImageParams()
      .size(100, 80)
      .url()
  },

  {
    name: 'toString() aliases url()',
    url: urlFor
      .image(croppedImage())
      .ignoreImageParams()
      .size(100, 80)
      .toString()
  },

  {
    name: 'skips hotspot/crop if crop mode specified',
    url: urlFor
      .image(croppedImage())
      .size(100, 80)
      .crop('center')
      .url()
  },

  {
    name: 'skips hotspot/crop if focal point specified',
    url: urlFor
      .image(croppedImage())
      .size(100, 80)
      .focalPoint(10, 20)
      .url()
  },

  {
    name: 'does not crop image with no crop/hotspot specified',
    url: urlFor
      .image(imageWithNoCropSpecified())
      .width(80)
      .url()
  },

  {
    name: 'does crop image with no crop/hotspot specified if aspect ratio is forced',
    url: urlFor
      .image(imageWithNoCropSpecified())
      .width(80)
      .height(80)
      .url()
  },

  {
    name: 'can specify options with url params',
    url: urlFor
      .image(croppedImage())
      .withOptions({w: 320, h: 240})
      .url()
  },

  {
    name: 'flip horizontal',
    url: stripPath(
      urlFor
        .image(noHotspotImage())
        .flipHorizontal()
        .url()
    )
  },

  {
    name: 'flip vertical',
    url: stripPath(
      urlFor
        .image(noHotspotImage())
        .flipVertical()
        .url()
    )
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
    )
    // eslint-disable-next-line max-len
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
    )
    // eslint-disable-next-line max-len
  }
]

describe('builder', () => {
  cases.forEach(testCase => {
    test(testCase.name, () => {
      expect(testCase.url).toMatchSnapshot()
    })
  })

  test('should throw on invalid fit mode', () => {
    expect(() => urlFor.image(croppedImage()).fit('moo')).toThrowError(/Invalid fit mode "moo"/)
  })

  test('should throw on invalid crop mode', () => {
    expect(() => urlFor.image(croppedImage()).crop('moo')).toThrowError(/Invalid crop mode "moo"/)
  })
})
