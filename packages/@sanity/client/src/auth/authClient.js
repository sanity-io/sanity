const assign = require('object-assign')

function AuthClient(client) {
  this.client = client
}

assign(AuthClient.prototype, {

  getLoginProviders() {
    return this.client.request({uri: '/auth/providers'})
  },

  logout() {
    return this.client.request({uri: '/auth/logout'})
  }

})

module.exports = AuthClient
