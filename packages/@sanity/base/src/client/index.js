import sanityClient from '@sanity/client'
import config from 'config:sanity'
import configureClient from 'part:@sanity/base/configure-client?'

const apiConfig = {...config.api, withCredentials: true}
const client = sanityClient(apiConfig)

export default configureClient ? configureClient(sanityClient(apiConfig)) : client
