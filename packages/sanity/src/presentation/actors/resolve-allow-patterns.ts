import {fromPromise, type PromiseActorLogic} from 'xstate'

import {type PreviewUrlAllowOption, type PreviewUrlAllowOptionContext} from '../types'

interface Context extends Pick<PreviewUrlAllowOptionContext, 'client'> {
  allowOption: PreviewUrlAllowOption | undefined
}
type Input = Omit<PreviewUrlAllowOptionContext, 'client' | 'origin'>

/** @internal */
export function defineResolveAllowPatternsActor({
  client,
  allowOption,
}: Context): PromiseActorLogic<URLPattern[], Input> {
  return fromPromise<URLPattern[], Input>(async ({input}) => {
    const {initialUrl} = input

    /**
     * Lazy load the URLPattern polyfill on-demand, if needed
     */
    if (typeof URLPattern === 'undefined') {
      await import('urlpattern-polyfill')
    }

    /**
     * If no allow option is provided, we use the initial URL to infer the pattern
     */
    if (!allowOption) {
      return [new URLPattern(initialUrl.origin)]
    }

    const maybePatterns =
      typeof allowOption === 'function'
        ? await allowOption({client, origin, initialUrl})
        : allowOption
    const patterns = Array.isArray(maybePatterns) ? maybePatterns : [maybePatterns]
    const urlPatterns = patterns.map((value) => {
      const urlPattern = new URLPattern(value)
      if (urlPattern.hostname === '*') {
        throw new Error(
          `It's insecure to allow any hostname, it could disclose data to a malicious site`,
        )
      }
      return urlPattern
    })
    /**
     * If the declared patterns don't consider the initial URL valid, we add it to the list of patterns
     */
    if (!urlPatterns.some((pattern) => pattern.test(initialUrl.origin))) {
      return [...urlPatterns, new URLPattern(initialUrl.origin)]
    }

    return urlPatterns
  })
}
