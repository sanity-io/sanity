const ConfigStore = require('configstore')
const client = require('part:@sanity/base/client?')

if (!client) {
  throw new Error('--with-user-token specified, but @sanity/base is not a plugin in this project')
}

// eslint-disable-next-line no-process-env
const sanityEnv = (process.env.SANITY_ENV || '').toLowerCase()
const defaults = {}
const config = new ConfigStore(
  sanityEnv && sanityEnv !== 'production' ? `sanity-${sanityEnv}` : 'sanity',
  defaults,
  {globalConfigPath: true}
)

const token = config.get('authToken')
if (!token) {
  throw new Error(
    '--with-user-token specified, but no auth token could be found. Run `sanity login`'
  )
}

client.config({token})
