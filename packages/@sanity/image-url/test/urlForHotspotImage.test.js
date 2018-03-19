import should from 'should'
import urlForHotspotImage from '../src/urlForImage'
import {uncroppedImage, croppedImage, noHostpotImage} from './fixtures'

describe('urlForHotspotImage', () => {
  it('does not crop when no crop is required', () => {
    should(
      urlForHotspotImage({source: uncroppedImage(), projectId: 'zp7mbokg', dataset: 'production'})
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg'
    )
  })

  it('does does not crop, but limits size when only width dimension is specified', () => {
    should(
      urlForHotspotImage({
        source: uncroppedImage(),
        projectId: 'zp7mbokg',
        dataset: 'production',
        width: 100
      })
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?w=100'
    )
  })

  it('does does not crop, but limits size when only height dimension is specified', () => {
    should(
      urlForHotspotImage({
        source: uncroppedImage(),
        projectId: 'zp7mbokg',
        dataset: 'production',
        height: 100
      })
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?h=100'
    )
  })

  it('a tall crop is centered on the hotspot', () => {
    should(
      urlForHotspotImage({
        source: uncroppedImage(),
        projectId: 'zp7mbokg',
        dataset: 'production',
        width: 30,
        height: 100
      })
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?rect=150,0,900,3000&w=30&h=100'
    )
  })

  it('a wide crop is centered on the hotspot', () => {
    should(
      urlForHotspotImage({
        source: uncroppedImage(),
        projectId: 'zp7mbokg',
        dataset: 'production',
        width: 100,
        height: 30
      })
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?rect=0,525,2000,600&w=100&h=30'
    )
  })

  it('a crop with identical aspect and no specified crop is not cropped', () => {
    should(
      urlForHotspotImage({
        source: uncroppedImage(),
        projectId: 'zp7mbokg',
        dataset: 'production',
        width: 200,
        height: 300
      })
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?w=200&h=300'
    )
  })

  it('respects the crop, even when no explicit crop is asked for', () => {
    should(
      urlForHotspotImage({source: croppedImage(), projectId: 'zp7mbokg', dataset: 'production'})
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?rect=200,300,1600,2400'
    )
  })

  it('a tall crop is centered on the hotspot and constrained within the image crop', () => {
    should(
      urlForHotspotImage({
        source: croppedImage(),
        projectId: 'zp7mbokg',
        dataset: 'production',
        width: 30,
        height: 100
      })
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?rect=240,300,720,2400&w=30&h=100'
    )
  })

  it('ignores the image crop if caller specifies another', () => {
    should(
      urlForHotspotImage({
        source: croppedImage(),
        rect: {left: 10, top: 20, width: 30, height: 40},
        projectId: 'zp7mbokg',
        dataset: 'production',
        width: 30,
        height: 100
      })
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?rect=10,20,30,40&w=30&h=100'
    )
  })

  it('gracefully handles a non-hostpot image', () => {
    should(
      urlForHotspotImage({
        source: noHostpotImage(),
        projectId: 'zp7mbokg',
        dataset: 'production',
        height: 100
      })
    ).equal(
      'https://cdn.sanity.io/images/zp7mbokg/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg?h=100'
    )
  })
})
