const assign = require('xtend/mutable')

function UsersClient(client) {
  this.client = client
}

assign(UsersClient.prototype, {

  getById(id) {
    return this.client.request({uri: `/users/${id}`})
  }

})

module.exports = UsersClient
