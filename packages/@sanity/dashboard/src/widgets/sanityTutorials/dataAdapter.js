import imageUrlBuilder from '@sanity/image-url'
import {versionedClient} from '../../versionedClient'

const tutorialsProjectConfig = {
  projectId: '3do82whm',
  dataset: 'next',
}

export default {
  getFeed: (templateRepoId) => {
    const uri = templateRepoId
      ? `/addons/dashboard?templateRepoId=${templateRepoId}`
      : '/addons/dashboard'
    return versionedClient.observable.request({uri, withCredentials: false})
  },
  urlBuilder: imageUrlBuilder(tutorialsProjectConfig),
}
