let client

module.exports = function getClient() {
  if (!client) {
    // Lazy-loading to not cause issues when loading schema in node environment
    const sanityClient = require('part:@sanity/base/client')
    client = sanityClient.withConfig({apiVersion: '1'})
  }

  return client
}
