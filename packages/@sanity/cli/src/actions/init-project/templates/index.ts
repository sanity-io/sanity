import type {ProjectTemplate} from '../initProject'
import blog from './blog'
import clean from './clean'
import getStartedTemplate from './getStarted'
import moviedb from './moviedb'
import shopify from './shopify'
import shopifyOnline from './shopifyOnline'

const templates: Record<string, ProjectTemplate | undefined> = {
  blog,
  clean,
  'get-started': getStartedTemplate,
  moviedb,
  shopify,
  'shopify-online-storefront': shopifyOnline,
}

export default templates
