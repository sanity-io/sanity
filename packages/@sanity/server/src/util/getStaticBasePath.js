const getStaticBasePath = config => {
  if (!config.project || !config.project.basePath) {
    return '/static'
  }

  const basePath = ((config.project && config.project.basePath) || '').replace(/\/+$/, '')
  return `${basePath}/static`
}

module.exports = getStaticBasePath
