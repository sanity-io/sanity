import {route} from 'part:@sanity/base/router'
import {FormBuilderPerfTool} from './FormBuilderPerfTool'

export default {
  router: route('/:type/:id'),
  title: 'Form builder perf tool',
  name: 'form-builder-perf-tool',
  component: FormBuilderPerfTool
}
