import {type ProjectTemplate} from '../initProject'
import appTemplate from './appQuickstart'
import blog from './blog'
import clean from './clean'
import getStartedTemplate from './getStarted'
import moviedb from './moviedb'
import quickstart from './quickstart'
import shopify from './shopify'
import shopifyOnline from './shopifyOnline'

const templates: Record<string, ProjectTemplate | undefined> = {
  blog,
  clean,
  'app-quickstart': appTemplate,
  'get-started': getStartedTemplate,
  moviedb,
  shopify,
  'shopify-online-storefront': shopifyOnline,
  quickstart, // empty project that dynamically imports its own schema
}

export default templates
