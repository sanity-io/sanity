import {VALID_TAGS} from './constants'
import {type DistTag} from './types'

export function isValidTag(tag: string): tag is DistTag {
  return VALID_TAGS.includes(tag as any)
}
