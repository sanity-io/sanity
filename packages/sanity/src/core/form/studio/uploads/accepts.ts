import type {FileLike} from './types'

/**
 * Check if the provided file type should be accepted by the input with accept attribute.
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#attr-accept
 *
 * Inspired by https://github.com/enyo/dropzone (MIT) (c) 2021 Matias Meno
 * Based on https://github.com/react-dropzone/attr-accept (MIT) (c) 2015 Andrey Okonetchnikov
 *
 * @param file - https://developer.mozilla.org/en-US/docs/Web/API/File
 * @param acceptedFiles - List of accepted mime types (comma-separated string or array)
 * @returns True if file is accepted, false otherwise
 */
export function accepts(file: FileLike, acceptedFiles: string | string[]): boolean {
  if (!file || !acceptedFiles) {
    return true
  }

  const acceptedFilesArray = Array.isArray(acceptedFiles)
    ? acceptedFiles // eg `['image/png', 'image/jpeg']`
    : acceptedFiles.split(',') // eg `image/png,image/jpeg`

  const fileName = file.name || ''
  const mimeType = (file.type || '').toLowerCase()
  const baseMimeType = mimeType.replace(/\/.*$/, '')

  return acceptedFilesArray.some((type) => {
    const validType = type.trim().toLowerCase()

    if (validType.charAt(0) === '.') {
      return fileName.toLowerCase().endsWith(validType)
    }

    if (validType.endsWith('/*')) {
      // This is something like a image/* mime type
      return baseMimeType === validType.replace(/\/.*$/, '')
    }

    return mimeType === validType
  })
}
