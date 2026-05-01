import {type DocumentTarget} from './types'

// Cache key for document-scoped target resolution; pair keys are id-pair based, while this
// needs to preserve the selected version and variant context before resolution.
export function getTargetKey(target: DocumentTarget): string {
  return `${target.baseId}:${target.version}:${target.variant ?? ''}`
}
