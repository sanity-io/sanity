const path = require('path')

module.exports = {
  webpackDevMiddleware: (config) => {
    config.resolve = {
      symlinks: true,
      modules: [path.resolve('node_modules/slate-react'), path.resolve('node_modules/slate')],
    }
    return config
  },
}
