// @flow
/**
 * Check if the provided file type should be accepted by the input with accept attribute.
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-accept
 *
 * Inspired by:
 *  - https://github.com/enyo/dropzone
 *  - https://github.com/okonet/attr-accept/
 *
 * @param file {File} https://developer.mozilla.org/en-US/docs/Web/API/File
 * @param accepted {string}
 * @returns {boolean}
 */

type AcceptArg = string | Array<string>
type FileArg = {name: string, type: string}

export function parse(accepted: AcceptArg) : Array<string> {

}

export default function accept(file: FileArg, accepted: AcceptArg): boolean {

  if (!file || !accepted) {
    return true
  }

  const acceptedArray = (Array.isArray(accepted) ? accepted : accepted.split(','))
  const fileName = file.name || ''
  const mimeType = file.type || ''
  const baseMimeType = mimeType.replace(/\/.*$/, '')

  return acceptedArray.some(type => {
    const validType = type.trim()
    if (validType.charAt(0) === '.') {
      return fileName.toLowerCase().endsWith(validType.toLowerCase())
    } else if (/\/\*$/.test(validType)) {
      // This is something like a image/* mime type
      return baseMimeType === validType.replace(/\/.*$/, '')
    }
    return mimeType === validType
  })
}
