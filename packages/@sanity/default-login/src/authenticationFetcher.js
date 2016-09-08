import client from 'client:@sanity/base/client'

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
  }),

  logout: () => client.request({
    uri: '/auth/logout',
    withCredentials: true
  })
}
