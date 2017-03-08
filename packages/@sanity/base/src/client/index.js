import sanityClient from '@sanity/client'
import config from 'config:sanity'

module.exports = sanityClient(config.api)
