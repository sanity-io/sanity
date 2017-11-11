import sanityImage from '../src/builder'
import should from 'should'
import {uncroppedImage, croppedImage, noHostpotImage} from './fixtures'

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
      .url()
    ),
    expect: 'rect=10,20,30,40&fp-x=10&fp-x=20&flip=hv&fm=png&dl=a.png&blur=50&invert=true&or=90&min-h=150&max-h=300&min-w=100&max-w=200&q=50'
  }
]

describe('builder', () => {
  cases.forEach(testCase => {
    it(testCase.name, () => {
      should(testCase.url).equal(testCase.expect)
    })
  })
})
