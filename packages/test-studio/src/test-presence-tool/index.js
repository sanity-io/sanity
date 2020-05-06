import {TestPresenceTool} from './TestPresenceTool'
import {route} from 'part:@sanity/base/router'

export default {
  router: route('/:type/:id'),
  title: 'Test presence',
  name: 'test-presence-tool',
  component: TestPresenceTool
}
