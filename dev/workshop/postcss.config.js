const postcssCssnext = require('postcss-cssnext')

module.exports = {
  plugins: [
    postcssCssnext({
      features: {
        customProperties: true,
      },
    }),
  ],
}
