import client from 'part:@sanity/base/client'

export default {
  getProviders: () => client.request({
    uri: '/auth/providers',
    withCredentials: true
  }).then(res => res.providers),

  getCurrentUser: () => client.request({
    uri: '/users/me',
    withCredentials: true
  }).then(user => {
    return user && user.id ? user : null
  }).catch(err => {
    if (err.statusCode === 401) {
      return null
    }
    throw err
  }),

  logout: () => client.auth.logout()
}
