import {type ProjectTemplate} from '../initProject'
import appTemplate from './appQuickstart'
import appSanityUiTemplate from './appSanityUi'
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
  'app-sanity-ui': appSanityUiTemplate,
  'get-started': getStartedTemplate,
  moviedb,
  shopify,
  'shopify-online-storefront': shopifyOnline,
  quickstart, // empty project that dynamically imports its own schema
}

export default templates
