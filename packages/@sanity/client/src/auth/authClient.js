const assign = require('xtend/mutable')

function AuthClient(client) {
  this.client = client
}

assign(AuthClient.prototype, {

  getLoginProviders() {
    return this.client.request({uri: '/auth/providers'})
  }

})

module.exports = AuthClient
