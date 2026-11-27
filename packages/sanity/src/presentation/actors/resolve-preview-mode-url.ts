import {fromPromise, type PromiseActorLogic} from 'xstate'

import {type PresentationPerspective, type PreviewUrlPreviewMode} from '../types'
import {createPreviewModeEnableUrl} from '../util/createPreviewModeEnableUrl'

/** @internal */
export interface ResolvePreviewModeUrlInput {
  previewUrlSecret: string
  resolvedPreviewMode: PreviewUrlPreviewMode
  initialUrl: URL
}

/** @internal */
export function defineResolvePreviewModeUrlActor({
  perspective,
  variant,
}: {
  perspective: PresentationPerspective
  variant: string | undefined
}): PromiseActorLogic<URL, ResolvePreviewModeUrlInput> {
  return fromPromise<URL, ResolvePreviewModeUrlInput>(async ({input}) => {
    const {previewUrlSecret, resolvedPreviewMode, initialUrl} = input

    /**
     * If the resolved preview mode is false then we have an unexpected state that shouldn't be possible
     */
    if (!resolvedPreviewMode) {
      throw new Error('Resolved preview mode is false')
    }

    return createPreviewModeEnableUrl({
      enable: resolvedPreviewMode.enable,
      perspective,
      previewUrl: initialUrl,
      previewUrlSecret,
      variant,
    })
  })
}
