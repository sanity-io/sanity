/* global window */
import orient from './lib/orient'

export default rotateImage

const orientations = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
  'left-top',
  'right-top',
  'right-bottom',
  'left-bottom'
]

function readImage(url) {
  const image = new window.Image()
  //console.time("read image");
  return new Promise(function (resolve) {
    image.onload = function () {
      //console.timeEnd("read image");
      resolve(image)
    }
    image.src = url
  })
}

function rotateImage(file, exifData) {
  return readImage(window.URL.createObjectURL(file)).then(function (image) {
    return orient(image, orientations.indexOf(exifData.orientation) + 1)
  })
    .then(function (url) {
      //console.timeEnd("create objecturl");
      return url
    })
}
