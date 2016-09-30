const assign = require('xtend/mutable')
const Patch = require('./data/patch')
const Transaction = require('./data/transaction')
const DataClient = require('./data/dataClient')
const DatasetsClient = require('./datasets/datasetsClient')
const ProjectsClient = require('./projects/projectsClient')
const UsersClient = require('./users/usersClient')
const AuthClient = require('./auth/authClient')
const httpRequest = require('./http/request')
const getRequestOptions = require('./http/requestOptions')
const {defaultConfig, initConfig} = require('./config')

function SanityClient(config = defaultConfig) {
  this.config(config)

  this.data = new DataClient(this)
  this.datasets = new DatasetsClient(this)
  this.projects = new ProjectsClient(this)
  this.users = new UsersClient(this)
  this.auth = new AuthClient(this)
}

assign(SanityClient.prototype, {
  config(newConfig) {
    if (typeof newConfig === 'undefined') {
      return this.clientConfig
    }

    this.clientConfig = initConfig(newConfig, this.clientConfig || {})
    return this
  },

  getUrl(uri) {
    return `${this.clientConfig.url}/${uri.replace(/^\//, '')}`
  },

  request(options) {
    return httpRequest(assign(
      getRequestOptions(this.clientConfig),
      options,
      {uri: this.getUrl(options.uri)}
    )).toPromise()
  }
})

function createClient(config) {
  return new SanityClient(config)
}

createClient.Patch = Patch
createClient.Transaction = Transaction

module.exports = createClient
