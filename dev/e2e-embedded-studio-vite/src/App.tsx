import {Studio} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1'

import config from '../sanity.config'

export function App() {
  return <Studio config={config} />
}
