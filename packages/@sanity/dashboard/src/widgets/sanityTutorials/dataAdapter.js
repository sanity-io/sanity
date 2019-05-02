import client from 'part:@sanity/base/client'
import sanityClient from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const configuredClient = sanityClient({
  projectId: '3do82whm',
  dataset: 'production',
  useCdn: true
})

export default {
  getFeed: templateRepoId => {
    const uri = templateRepoId
      ? `/addons/dashboard?templateRepoId=${templateRepoId}`
      : '/addons/dashboard'
    return client.request({uri, withCredentials: false})
  },
  urlBuilder: imageUrlBuilder(configuredClient)
}
