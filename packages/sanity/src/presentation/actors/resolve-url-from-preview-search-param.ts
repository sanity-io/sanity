import {fromPromise} from 'xstate'

/** @internal */
export const resolveUrlFromPreviewSearchParamActor = fromPromise<
  URL,
  {initialUrl: URL; previewSearchParam: string | null | undefined; allowOrigins: URLPattern[]}
>(async ({input}) => {
  const {previewSearchParam, initialUrl, allowOrigins} = input

  /**
   * If the preview search param is falsy we can skip
   */
  if (!previewSearchParam) {
    return initialUrl
  }

  /**
   * Validate the previewSearchParam
   */
  try {
    const previewSearchParamUrl = new URL(previewSearchParam, initialUrl.origin)
    if (!allowOrigins.some((pattern) => pattern.test(previewSearchParamUrl.origin))) {
      return initialUrl
    }
    return previewSearchParamUrl
  } catch (err) {
    return initialUrl
  }
})
