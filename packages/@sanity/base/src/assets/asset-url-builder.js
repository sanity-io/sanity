const sanityUrlMatch = /^https?:\/\/cdn.sanity.\w+\/images\//

export default function assetUrlBuilder(asset) {
  const {url, width, height, fit} = asset
  if (!sanityUrlMatch.test(url) || url.indexOf('?') !== -1) {
    return url
  }

  const defaultFit = width === height ? 'crop' : 'clip'
  const params = [
    width && `w=${width}`,
    height && `h=${height}`,
    `fit=${fit ? fit : defaultFit}`,
    'ch=DPR',
    'q=85',
  ].filter(Boolean).join('&')

  return `${url}?${params}`
}
