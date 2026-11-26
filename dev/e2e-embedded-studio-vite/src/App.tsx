import {Studio} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import config from '../sanity.config'

export function App() {
  return <Studio config={config} />
}
