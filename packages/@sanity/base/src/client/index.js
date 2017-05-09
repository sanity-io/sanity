import sanityClient from '@sanity/client'
import config from 'config:sanity'
import configureClient from 'part:@sanity/base/configure-client?'

const client = sanityClient(config.api)

export default configureClient ? configureClient(sanityClient(config.api)) : client
