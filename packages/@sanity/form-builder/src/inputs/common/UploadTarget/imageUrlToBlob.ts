// Loads an image, inserts it into a canvas and loads the canvas contents into a blob
export function imageUrlToBlob(imageUrl, format = 'image/jpeg', quality = 1): Promise<Blob> {
  if (imageUrl.match(/^webkit-fake-url:\/\//)) {
    return Promise.reject(new Error('Cannot read image contents from webkit fake url'))
  }
  return new Promise((resolve, reject) => {
    const loader = new Image()
    loader.crossOrigin = 'anonymous'
    loader.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = loader.width
      canvas.height = loader.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(loader, 0, 0, canvas.width, canvas.height)
      try {
        canvas.toBlob(resolve, format, quality)
      } catch (error) {
        reject(error)
      }
    }
    loader.src = imageUrl
  })
}
