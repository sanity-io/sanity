import exif from 'exif-component'

function readPromisified(file) {
  /* global window */
  const reader = new window.FileReader()

  //console.time("read exif");
  return new Promise((resolve, reject) => {
    reader.onerror = reject
    reader.onload = () => {
      let error = null
      let result = null
      try {
        result = exif(reader.result)
      } catch (err) {
        error = err
      }
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    }
    // read only 128k. should be enough for exif according to https://github.com/mattiasw/ExifReader#tips
    reader.readAsArrayBuffer(file.slice(0, 128000))
  })
}

export default function readExif(file) {
  return readPromisified(file)
    .then(exifData => {
      // Only care about orientation for now
      return {orientation: exifData.orientation}
    })
    .catch(error => {
      if (/invalid image format/i.test(error.message)) {
        return null
      }
      if (/No exif data/i.test(error.message)) {
        return null
      }
      return Promise.reject(error)
    })
}
