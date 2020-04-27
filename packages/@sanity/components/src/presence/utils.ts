import {MAX_AVATARS} from './constants'

export const splitRight = (array: Array<any>): Array<any> => {
  const indexFromMax = array.length > MAX_AVATARS ? MAX_AVATARS - 1 : MAX_AVATARS
  const idx = Math.max(0, array.length - indexFromMax)
  return [array.slice(0, idx), array.slice(idx)]
}
