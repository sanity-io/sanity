const mockBrowserEnvironment = require('../../util/mockBrowserEnvironment')

mockBrowserEnvironment(
  // eslint-disable-next-line no-process-env
  process.env.SANITY_BASE_PATH
)
