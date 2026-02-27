import {type SanityClient} from 'sanity'
import {fromPromise, type PromiseActorLogic} from 'xstate'

import {type PresentationPerspective, type PreviewUrlOption} from '../types'
import {encodeStudioPerspective} from '../util/encodeStudioPerspective'

/** @internal */
export function defineResolveInitialUrlActor({
  client,
  studioBasePath,
  previewUrlOption,
  perspective,
}: {
  client: SanityClient
  studioBasePath: string
  previewUrlOption: PreviewUrlOption | undefined
  perspective: PresentationPerspective
}): PromiseActorLogic<URL, {previewSearchParam: string | null}> {
  return fromPromise<URL, {previewSearchParam: string | null}>(
    async ({input}: {input: {previewSearchParam: string | null}}) => {
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
          studioPreviewPerspective: encodeStudioPerspective(perspective),
          previewSearchParam: input.previewSearchParam,
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
    },
  )
}
