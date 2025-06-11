import {validTags} from './constants'
import {type DistTag} from './types'

export function isValidTag(tag: string): tag is DistTag {
  return validTags.includes(tag as any)
}
