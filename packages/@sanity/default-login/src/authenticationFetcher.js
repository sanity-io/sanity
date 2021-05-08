import getProviders from './util/getProviders'
import {versionedClient} from './versionedClient'

export default {
  getProviders,

  getCurrentUser: () =>
    versionedClient
      .request({
        uri: '/users/me',
        withCredentials: true,
        tag: 'users.get-current',
      })
      .then((user) => {
        return user && user.id ? user : null
      })
      .catch((err) => {
        if (err.statusCode === 401) {
          return null
        }
        throw err
      }),

  logout: () => versionedClient.auth.logout(),
}
