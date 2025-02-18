import {
  urlSearchParamPreviewPathname,
  urlSearchParamPreviewPerspective,
  urlSearchParamPreviewSecret,
} from '@sanity/preview-url-secret/constants'
import {
  type PreviewUrlResolver,
  type PreviewUrlResolverOptions,
} from '@sanity/preview-url-secret/define-preview-url'
import {type SanityClient} from 'sanity'
import {fromPromise, type PromiseActorLogic} from 'xstate'

import {type PreviewUrlOption, type PreviewUrlPreviewMode} from '../types'

/** @internal */
export interface ResolvePreviewModeUrlInput {
  previewSearchParam: string
  previewUrlSecret: string
  resolvedPreviewMode: PreviewUrlPreviewMode
}

/** @internal */
export function defineResolvePreviewModeUrlActor({
  client,
  studioBasePath,
  previewUrlOption,
}: {
  client: SanityClient
  studioBasePath: string
  previewUrlOption: PreviewUrlOption | undefined
}): PromiseActorLogic<URL, ResolvePreviewModeUrlInput> {
  return fromPromise<URL, ResolvePreviewModeUrlInput>(async ({input}) => {
    const {previewSearchParam, previewUrlSecret, resolvedPreviewMode} = input

    /**
     * If the previewUrlOption is a function, we need to resolve it and maintain backwards compatibility
     */
    if (typeof previewUrlOption === 'function') {
      const initial = await previewUrlOption({
        client,
        studioBasePath,
        previewUrlSecret,
        // @TODO send the current perspective here
        studioPreviewPerspective: 'drafts',
        // Intentionally hardcoding to `null` as we're resolving the initial URL before we're resolving allowed origins, and need to protect against XSS generated studio links that sets `https://example.com/studio/presentation?preview=https://bad-actor.com/export-sanity-dataset`
        previewSearchParam: null,
      })
      return new URL(initial, previewSearchParam)
    }

    const initial = new URL(previewSearchParam)
    const resolvePreviewUrl = definePreviewUrl<SanityClient>({
      previewMode: resolvedPreviewMode,
      origin: initial.origin,
      preview: previewSearchParam,
    })
    const resolvedUrl = await resolvePreviewUrl({
      client,
      previewUrlSecret,
      // @TODO send the current perspective here
      studioPreviewPerspective: 'drafts',
      previewSearchParam,
      studioBasePath,
    })
    return new URL(resolvedUrl, previewSearchParam)
  })
}

function definePreviewUrl<SanityClientType>(
  options: PreviewUrlResolverOptions,
): PreviewUrlResolver<SanityClientType> {
  const {
    draftMode,
    previewMode,
    origin = typeof location === 'undefined' ? 'https://localhost' : location.origin,
  } = options
  const enableUrl = previewMode?.enable || draftMode?.enable
  let {preview = '/'} = options
  const productionUrl = new URL(preview, origin)
  const enablePreviewModeUrl = enableUrl ? new URL(enableUrl, origin) : undefined

  return async (context): Promise<string> => {
    try {
      if (context.previewSearchParam) {
        const restoredUrl = new URL(context.previewSearchParam, productionUrl)
        if (restoredUrl.origin === productionUrl.origin) {
          preview = `${restoredUrl.pathname}${restoredUrl.search}`
        }
      }
    } catch {
      // ignore
    }
    // Prevent infinite recursion
    if (
      typeof location !== 'undefined' &&
      location.origin === productionUrl.origin &&
      context.studioBasePath &&
      (preview.startsWith(`${context.studioBasePath}/`) || preview === context.studioBasePath)
    ) {
      preview = options.preview || '/'
    }
    const previewUrl = new URL(preview, productionUrl)
    if (enablePreviewModeUrl) {
      const enablePreviewModeRequestUrl = new URL(enablePreviewModeUrl)
      const {searchParams} = enablePreviewModeRequestUrl
      searchParams.set(urlSearchParamPreviewSecret, context.previewUrlSecret)
      searchParams.set(urlSearchParamPreviewPerspective, context.studioPreviewPerspective)
      if (previewUrl.pathname !== enablePreviewModeRequestUrl.pathname) {
        searchParams.set(
          urlSearchParamPreviewPathname,
          `${previewUrl.pathname}${previewUrl.search}`,
        )
      }

      return enablePreviewModeRequestUrl.toString()
    }
    return previewUrl.toString()
  }
}
