import {route} from '@sanity/base/router'
import SanityVision from './SanityVision'
import {EyeOpenIcon} from '@sanity/icons'

export default {
  router: route.create('/*'),
  name: 'vision',
  title: 'Vision',
  icon: EyeOpenIcon,
  component: SanityVision,
}
