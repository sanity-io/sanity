import {type ProjectTemplate} from '../initProject'
import blog from './blog'
import clean from './clean'
import coreAppTemplate from './coreApp'
import getStartedTemplate from './getStarted'
import moviedb from './moviedb'
import quickstart from './quickstart'
import shopify from './shopify'
import shopifyOnline from './shopifyOnline'

const templates: Record<string, ProjectTemplate | undefined> = {
  blog,
  clean,
  'core-app': coreAppTemplate,
  'get-started': getStartedTemplate,
  moviedb,
  shopify,
  'shopify-online-storefront': shopifyOnline,
  quickstart, // empty project that dynamically imports its own schema
}

export default templates
