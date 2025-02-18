import {fromPromise} from 'xstate'

/** @internal */
export const resolveUrlFromPreviewSearchParamActor = fromPromise<
  URL,
  {initialUrl: URL; previewSearchParam: string | null | undefined; allow: URLPattern[]}
>(async ({input}) => {
  const {previewSearchParam, initialUrl, allow} = input

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
    if (!allow.some((pattern) => pattern.test(previewSearchParamUrl.origin))) {
      return initialUrl
    }
    return previewSearchParamUrl
  } catch (err) {
    return initialUrl
  }
})
