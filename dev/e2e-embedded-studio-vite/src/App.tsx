// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {Studio} from 'sanity'

import config from '../sanity.config'

export function App() {
  return <Studio config={config} />
}
