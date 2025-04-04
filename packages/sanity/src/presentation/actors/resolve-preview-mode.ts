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
    if (typeof previewUrlOption.previewMode === 'function') {
      return previewUrlOption.previewMode({client, origin, targetOrigin})
    }

    return previewUrlOption.previewMode
  })
}
