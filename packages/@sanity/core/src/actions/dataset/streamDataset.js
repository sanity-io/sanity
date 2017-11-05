import simpleGet from 'simple-get'

export default (client, dataset) => {
  // Sanity client doesn't handle streams natively since we want to support node/browser
  // with same API. We're just using it here to get hold of URLs and tokens.
  const url = client.getUrl(`/data/export/${dataset}`)
  const headers = {Authorization: `Bearer ${client.config().token}`}
  return new Promise((resolve, reject) => {
    simpleGet({url, headers}, (err, res) => (err ? reject(err) : resolve(res)))
  })
}
