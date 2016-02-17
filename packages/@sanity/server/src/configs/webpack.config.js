import path from 'path'

export default {
  entry: [
    path.join(__dirname, '..', 'browser', 'entry')
  ],
  output: {
    path: path.join(__dirname, '..', '..', 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  module: {
    loaders: [{
      test: /\.jsx?/,
      loaders: ['babel'],
      include: path.join(__dirname, '..')
    }]
  }
}
