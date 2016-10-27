const assign = require('xtend/mutable')
const Patch = require('./data/patch')
const Transaction = require('./data/transaction')
const dataMethods = require('./data/dataMethods')
const DatasetsClient = require('./datasets/datasetsClient')
const ProjectsClient = require('./projects/projectsClient')
const AssetsClient = require('./assets/assetsClient')
const UsersClient = require('./users/usersClient')
const AuthClient = require('./auth/authClient')
const httpRequest = require('./http/request')
const getRequestOptions = require('./http/requestOptions')
const {defaultConfig, initConfig} = require('./config')

function SanityClient(config = defaultConfig) {
  this.config(config)

  this.assets = new AssetsClient(this)
  this.datasets = new DatasetsClient(this)
  this.projects = new ProjectsClient(this)
  this.users = new UsersClient(this)
  this.auth = new AuthClient(this)
}

assign(SanityClient.prototype, dataMethods)
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
    return this.requestObservable(options).toPromise()
  },

  clone(newConfig) {
    const mergedConfig = assign(this.config(), newConfig || {})
    return new SanityClient(mergedConfig)
  },

  requestObservable(options) {
    return httpRequest(mergeOptions(
      getRequestOptions(this.clientConfig),
      options,
      {uri: this.getUrl(options.uri)}
    ))
  }
})

// Merge http options and headers
function mergeOptions(...opts) {
  const headers = opts.reduce((merged, options) => {
    if (!merged && !options.headers) {
      return null
    }
    return assign(merged || {}, options.headers || {})
  }, null)
  return assign(...opts, headers ? {headers} : {})
}

function createClient(config) {
  return new SanityClient(config)
}

createClient.Patch = Patch
createClient.Transaction = Transaction

module.exports = createClient
