import orient from './orient'

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
  /* global window */
  const image = new window.Image()
  //console.time("read image");
  return new Promise((resolve, reject) => {
    image.onerror = reject
    image.onload = () => {
      //console.timeEnd("read image");
      resolve(image)
    }
    image.src = url
  })
}

export default function rotateImage(file, orientation) {
  /* global window */
  const objectUrl = window.URL.createObjectURL(file)
  return readImage(objectUrl)
    .then(image => orient(image, orientations.indexOf(orientation) + 1))
}
