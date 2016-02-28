/* global window */
import exif from 'exif-component'

export default function readExif(file) {
  const reader = new window.FileReader()

  //console.time("read exif");
  return new Promise(function (resolve, reject) {
    reader.onload = function () {
      try {
        resolve(exif(reader.result))
      }
      catch (e) {
        if (/invalid image format/i.test(e.message)) {
          return resolve(null)
        }
        if (/No exif data/i.test(e.message)) {
          return resolve(null)
        }
        reject(e)
      }
      //finally {
      //  console.timeEnd("read exif");
      //}
    }
    // read only 128k. should be enough for exif according to https://github.com/mattiasw/ExifReader#tips
    reader.readAsArrayBuffer(file.slice(0, 128000))
  })
}
