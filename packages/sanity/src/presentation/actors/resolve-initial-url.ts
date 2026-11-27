import {type SanityClient} from 'sanity'
import {fromPromise, type PromiseActorLogic} from 'xstate'

import {type PreviewUrlOption} from '../types'

/** @internal */
export function defineResolveInitialUrlActor({
  client,
  previewUrlOption,
}: {
  client: SanityClient
  previewUrlOption: PreviewUrlOption | undefined
}): PromiseActorLogic<URL, {previewSearchParam: string | null}> {
  return fromPromise<URL, {previewSearchParam: string | null}>(async () => {
    const {origin} = location

    /**
     * Provide backwards compatibility for versions where `previewUrl` where optional
     */
    if (!previewUrlOption) {
      return new URL('/', origin)
    }
    /**
     * Support setting `previewUrl` as a string shorthand
     */
    if (typeof previewUrlOption === 'string') {
      return new URL(previewUrlOption, origin)
    }

    if (typeof previewUrlOption.initial === 'function') {
      const initial = await previewUrlOption.initial({
        client,
        origin,
      })
      return new URL(initial, origin)
    }

    if (typeof previewUrlOption.initial === 'string') {
      return new URL(previewUrlOption.initial, origin)
    }

    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return new URL(previewUrlOption.preview || '/', previewUrlOption.origin || origin)
  })
}
