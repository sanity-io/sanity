import {type SanityClient} from 'sanity'
import {fromPromise, type PromiseActorLogic} from 'xstate'

import {
  type PresentationPerspective,
  type PreviewUrlOption,
  type PreviewUrlPreviewMode,
} from '../types'
import {createPreviewModeEnableUrl} from '../util/createPreviewModeEnableUrl'
import {encodeStudioPerspective} from '../util/encodeStudioPerspective'

/** @internal */
export interface ResolvePreviewModeUrlInput {
  previewUrlSecret: string
  resolvedPreviewMode: PreviewUrlPreviewMode
  initialUrl: URL
}

/** @internal */
export function defineResolvePreviewModeUrlActor({
  client,
  studioBasePath,
  previewUrlOption,
  perspective,
  variant,
}: {
  client: SanityClient
  studioBasePath: string
  previewUrlOption: PreviewUrlOption | undefined
  perspective: PresentationPerspective
  variant: string | undefined
}): PromiseActorLogic<URL, ResolvePreviewModeUrlInput> {
  return fromPromise<URL, ResolvePreviewModeUrlInput>(async ({input}) => {
    const {previewUrlSecret, resolvedPreviewMode, initialUrl} = input

    /**
     * If the previewUrlOption is a function, we need to resolve it and maintain backwards compatibility
     */
    if (typeof previewUrlOption === 'function') {
      const initial = await previewUrlOption({
        client,
        studioBasePath,
        previewUrlSecret,
        studioPreviewPerspective: encodeStudioPerspective(perspective),
        studioPreviewVariant: variant,
        previewSearchParam: initialUrl.toString(),
      })
      return new URL(initial, initialUrl)
    }

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
