export function imageUrlToBlob(
  imageUrl: string,
  format = 'image/jpeg',
  quality = 1
): Promise<Blob | null> {
  if (imageUrl.match(/^webkit-fake-url:\/\//)) {
    return Promise.reject(new Error('Cannot read image contents from webkit fake url'))
  }
  return new Promise((resolve, reject) => {
    const loader = new Image()
    loader.crossOrigin = 'anonymous'
    loader.referrerPolicy = 'strict-origin-when-cross-origin'
    loader.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = loader.width
      canvas.height = loader.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(loader, 0, 0, canvas.width, canvas.height)
      try {
        canvas.toBlob(resolve, format, quality)
      } catch (error) {
        reject(error)
      }
    }
    loader.src = imageUrl
  })
}
