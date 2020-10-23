import {route} from 'part:@sanity/base/router'
import SanityVision from './SanityVision'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'

export default {
  router: route('/*'),
  name: 'vision',
  title: 'Vision',
  icon: VisibilityIcon,
  component: SanityVision,
}
