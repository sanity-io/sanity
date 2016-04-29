import sanityClient from '@sanity/client-next'
import config from 'config:sanity'

const client = sanityClient(config.api)

module.exports = client
