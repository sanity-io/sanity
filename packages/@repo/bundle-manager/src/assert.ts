import {type DistTag} from './types'

export function isValidTag(tag: string): tag is DistTag {
  return tag === 'latest'
}
