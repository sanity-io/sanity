import client from 'part:@sanity/base/client'
import getProviders from './util/getProviders'

export default {
  getProviders,

  getCurrentUser: () =>
    client
      .request({
        uri: '/users/me',
        withCredentials: true,
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

  logout: () => client.auth.logout(),
}
