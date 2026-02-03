import {type PreviewUrlRef} from './machines/preview-url'
import {useSelector} from '@xstate/react'

export function useTargetOrigin(previewUrlRef: PreviewUrlRef): string {
  const targetOrigin = useSelector(previewUrlRef, (state) => state.context.previewUrl?.origin)
  if (!targetOrigin) {
    throw new TypeError('targetOrigin is required')
  }
  return targetOrigin
}
