import got from 'got'

export default (client, dataset) => {
  // Sanity client doesn't handle streams natively since we want to support node/browser
  // with same API. We're just using it here to get hold of URLs and tokens.
  const url = client.getUrl(`/data/export/${dataset}`)
  return got.stream(url, {
    headers: {Authorization: `Bearer: ${client.config().token}`}
  })
}
