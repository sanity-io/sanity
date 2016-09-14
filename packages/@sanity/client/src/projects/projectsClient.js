const assign = require('xtend/mutable')

function ProjectsClient(client) {
  this.client = client
}

assign(ProjectsClient.prototype, {

  list() {
    return this.client.request({uri: '/projects'})
  },

  getById(id) {
    return this.client.request({uri: `/projects/${id}`})
  }

})

module.exports = ProjectsClient
