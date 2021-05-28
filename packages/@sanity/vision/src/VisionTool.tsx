import {EyeOpenIcon} from '@sanity/icons'
import {route} from 'part:@sanity/base/router'
// import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import {SanityVision} from './SanityVision'

export default {
  router: route('/*'),
  name: 'vision',
  title: 'Vision',
  icon: EyeOpenIcon,
  component: SanityVision,
}
