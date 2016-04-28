import pify from 'pify'
import gradient from '@sanity/gradient-client'

class SanityClient {
  constructor(config = {}) {
    const client = gradient(config)

    this.gradient = pify({
      fetch: client.fetch.bind(client)
    })
  }

  fetch(query, opts) {
    return this.gradient.fetch(query, opts)
  }

  observe(query, opts) {

  }
}

function createClient(config) {
  return new SanityClient(config)
}

export default createClient
