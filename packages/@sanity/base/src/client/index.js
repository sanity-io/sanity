import sanityClient from '@sanity/client'
import config from 'config:sanity'

const client = sanityClient(config.api)

export default client
