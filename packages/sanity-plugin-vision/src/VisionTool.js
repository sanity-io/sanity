import {route} from 'part:@sanity/base/router'
import SanityVision from './SanityVision'
import VisionIcon from './components/VisionIcon'

export default {
  router: route('/*'),
  name: 'vision',
  title: 'Vision',
  icon: VisionIcon,
  component: SanityVision
}
