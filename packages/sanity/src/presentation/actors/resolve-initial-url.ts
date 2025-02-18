import {type SanityClient} from 'sanity'
import {fromPromise, type PromiseActorLogic} from 'xstate'

import {type PreviewUrlOption} from '../types'

/** @internal */
export function defineResolveInitialUrlActor({
  client,
  studioBasePath,
  previewUrlOption,
}: {
  client: SanityClient
  studioBasePath: string
  previewUrlOption: PreviewUrlOption | undefined
}): PromiseActorLogic<URL> {
  return fromPromise<URL>(async () => {
    const {origin} = location
    /**
     * If the previewUrlOption is a function, we need to resolve it and maintain backwards compatibility
     */
    if (typeof previewUrlOption === 'function') {
      const initial = await previewUrlOption({
        client,
        studioBasePath,
        // @TODO handle checking permissions here, and then generating a secret
        previewUrlSecret: '',
        // Intentionally hardcoding to `drafts` initially, as the initial URL is used as a fallback and won't be rerun as the global perspective changes
        studioPreviewPerspective: 'drafts',
        // Intentionally hardcoding to `null` as we're resolving the initial URL before we're resolving allowed origins, and need to protect against XSS generated studio links that sets `https://example.com/studio/presentation?preview=https://bad-actor.com/export-sanity-dataset`
        previewSearchParam: null,
      })
      return new URL(initial, origin)
    }

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

    return new URL(previewUrlOption.preview || '/', previewUrlOption.origin || origin)
  })
}
