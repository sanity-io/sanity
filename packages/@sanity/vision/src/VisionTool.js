import {route} from 'sanity'
import {EyeOpenIcon} from '@sanity/icons'
import SanityVision from './SanityVision'

export default {
  router: route.create('/*'),
  name: 'vision',
  title: 'Vision',
  icon: EyeOpenIcon,
  component: SanityVision,
}
