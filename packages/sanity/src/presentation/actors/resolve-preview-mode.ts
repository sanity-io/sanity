import {fromPromise, type PromiseActorLogic} from 'xstate'

import {
  type PreviewUrlOption,
  type PreviewUrlPreviewMode,
  type PreviewUrlPreviewModeOptionContext,
} from '../types'

type Options = Omit<PreviewUrlPreviewModeOptionContext, 'origin'>

interface Context extends Pick<Options, 'client'> {
  previewUrlOption: PreviewUrlOption | undefined
}
type Input = Omit<Options, 'client'>

/** @internal */
export function defineResolvePreviewModeActor({
  client,
  previewUrlOption,
}: Context): PromiseActorLogic<PreviewUrlPreviewMode | false, Input> {
  return fromPromise<PreviewUrlPreviewMode | false, Input>(async ({input}) => {
    const {targetOrigin} = input

    /**
     * Handle legacy draftMode options
     */
    if (typeof previewUrlOption === 'object' && previewUrlOption?.draftMode) {
      return {
        enable: previewUrlOption.draftMode.enable,
        shareAccess: previewUrlOption.draftMode.shareAccess ?? true,
      }
    }

    /**
     * If no preview mode option is provided, we disable preview mode
     */
    if (
      !previewUrlOption ||
      typeof previewUrlOption === 'string' ||
      typeof previewUrlOption === 'function' ||
      !previewUrlOption.previewMode
    ) {
      return false
    }

    /**
     * If the option is a function, we resolve it
     */
    const previewMode =
      typeof previewUrlOption.previewMode === 'function'
        ? await previewUrlOption.previewMode({client, origin, targetOrigin})
        : previewUrlOption.previewMode

    if (previewMode === false) {
      return false
    }

    /**
     * Return only supported preview mode options, filter out unknowns
     */
    return {
      enable: previewMode.enable,
      shareAccess: previewMode.shareAccess ?? true,
    }
  })
}
