import {User} from '@sanity/types'
import getProviders from './util/getProviders'
import {versionedClient} from './versionedClient'

export default {
  getProviders,

  getCurrentUser: (): Promise<User | null> =>
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

  logout: (): Promise<void> => versionedClient.auth.logout(),
}
