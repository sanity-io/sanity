import client from 'part:@sanity/base/client'
import imageUrlBuilder from '@sanity/image-url'

const configuredClient = client.clone().config({
  projectId: '3do82whm',
  dataset: 'next',
  useCdn: true
})

export default {
  getFeed: templateRepoId => {
    const uri = templateRepoId
      ? `/addons/dashboard?templateRepoId=${templateRepoId}`
      : '/addons/dashboard'
    return client.observable.request({uri, withCredentials: false})
  },
  urlBuilder: imageUrlBuilder(configuredClient)
}
