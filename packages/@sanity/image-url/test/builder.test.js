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
    name: 'handles crop and hotspot being set to null (GraphQL)',
    url: urlFor
      .image({
        _type: 'image',
        asset: {
          _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg',
          _type: 'reference'
        },
        crop: null,
        hotspot: null
      })
      .url()
  },

  {
    name: 'handles materialized assets (GraphQL)',
    url: urlFor
      .image({
        _type: 'image',
        asset: {
          _id: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg'
        },
        crop: null,
        hotspot: null
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
    name: 'automatic format',
    url: stripPath(
      urlFor
        .image(noHotspotImage())
        .auto('format')
        .url()
    )
  },

  {
    name: 'sub zero top/left',
    url: stripPath(
      urlFor
        .image('image-928ac96d53b0c9049836c86ff25fd3c009039a16-1200x966-jpg')
        .width(1000)
        .height(805)
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
        .auto('format')
        .forceDownload('a.png')
        .flipHorizontal()
        .flipVertical()
        .fit('crop')
        .url()
    )
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
        .bg('bf1942')
        .rect(10, 20, 30, 40)
        .format('png')
        .invert(true)
        .orientation(90)
        .quality(50)
        .auto('format')
        .forceDownload('a.png')
        .flipHorizontal()
        .flipVertical()
        .fit('crop')
        .crop('center')
        .url()
    )
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
