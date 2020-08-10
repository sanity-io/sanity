import UUID from '@sanity/uuid'

function extFromData(string: string): string | undefined {
  let ext: string

  if (string.match(/^data:application\/octet-stream/)) {
    ext = 'bin'
  }

  if (string.match(/^data:image/)) {
    ext = string.substring('data:image/'.length, string.indexOf(';base64'))
  }

  return ext
}

export function urlToFile(url: string, filename?: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onload = () => {
      const reader = new FileReader()
      reader.onloadend = () => {
        // Return early if we have a filename for this this file data
        if (filename) {
          return resolve(dataURLtoFile(reader.result, filename))
        }

        // Otherwise we need to dig into the string representation of the data to
        // determine what extension to use when constructing a filename
        const string = reader.result.toString()
        const ext = extFromData(string)

        if (!ext) {
          return reject(new Error('Could not find mime type for image'))
        }

        resolve(dataURLtoFile(reader.result, `${UUID()}.${ext}`))
      }
      reader.readAsDataURL(xhr.response)
    }
    xhr.onerror = error => {
      reject(error)
    }
    xhr.open('GET', url)
    xhr.responseType = 'blob'
    xhr.send()
  })
}

export function base64ToFile(base64Data: string | ArrayBuffer, filename?: string): Promise<File> {
  return new Promise((resolve, reject) => {
    // Return early if we have a filename for this this file data
    if (filename) {
      return resolve(dataURLtoFile(base64Data, filename))
    }
    const string = base64Data.toString()
    const ext = extFromData(string)
    if (!ext) {
      return reject(new Error('Could not find mime type for image'))
    }
    resolve(dataURLtoFile(base64Data, `${UUID()}.${ext}`))
  })
}

// FIXME: What happens if ArrayBuffer  is passed into here as dataurl?
// (base64Data in function base64ToFile is passed into dataurl param)
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, {type: mime})
}
