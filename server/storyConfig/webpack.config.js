const sanityServer = require('@sanity/server')

module.exports = sanityServer.getWebpackBaseConfig({
  basePath: process.cwd(),
  commonChunkPlugin: false
})
