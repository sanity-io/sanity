import {useSelector} from '@xstate/react'

import {type PreviewUrlRef} from './machines/preview-url'

export function useAllowPatterns(previewUrlRef: PreviewUrlRef) {
  const allowPatterns = useSelector(previewUrlRef, (state) => state.context.allowOrigins)
  if (!Array.isArray(allowPatterns)) {
    throw new TypeError('allowPatterns must be an array')
  }
  return allowPatterns
}
