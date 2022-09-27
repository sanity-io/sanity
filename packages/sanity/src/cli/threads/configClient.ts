import {getCliClient} from '@sanity/cli'
import ConfigStore from 'configstore'

// eslint-disable-next-line no-process-env
const sanityEnv = (process.env.SANITY_INTERNAL_ENV || '').toLowerCase()
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

// eslint-disable-next-line camelcase
getCliClient.__internal__getToken = () => token
