import StorybookTool from './StorybookTool'
import {route} from 'part:@sanity/base/router'

export default {
  router: route('/*'),
  title: 'Storybook',
  name: 'storybook',
  component: StorybookTool
}
