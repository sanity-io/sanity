import pify from 'pify'
import gradient from '@sanity/gradient-client'

class SanityClient {
  constructor(config = {}) {
    const client = gradient(config)

    this.gradient = pify({
      fetch: client.fetch.bind(client),
      update: client.update.bind(client)
    })
  }

  fetch(query, params) {
    return this.gradient.fetch(query, params).then(res => res.result)
  }

  update(documentId, patch, opts) {
    return this.gradient.update(documentId, patch, opts)
  }

  observe(query, opts) {

  }
}

function createClient(config) {
  return new SanityClient(config)
}

export default createClient
