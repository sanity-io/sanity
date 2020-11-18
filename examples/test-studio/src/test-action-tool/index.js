import {TestActionsTool} from './TestActionsTool'
import {route} from 'part:@sanity/base/router'

export default {
  router: route('/:type/:id'),
  title: 'Test actions',
  name: 'test-action-tool',
  component: TestActionsTool,
}
