const registerLoader = require('@sanity/plugin-loader')

// eslint-disable-next-line no-process-env
registerLoader({basePath: process.env.SANITY_BASE_PATH || process.cwd(), stubCss: true})
