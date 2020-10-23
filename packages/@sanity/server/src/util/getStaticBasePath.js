/* eslint-disable no-process-env */
const getStaticBasePath = (config) => {
  if (!process.env.STUDIO_BASEPATH && (!config.project || !config.project.basePath)) {
    return '/static'
  }

  const basePath = (
    process.env.STUDIO_BASEPATH ||
    (config.project && config.project.basePath) ||
    ''
  ).replace(/\/+$/, '')

  return `${basePath}/static`
}

module.exports = getStaticBasePath
