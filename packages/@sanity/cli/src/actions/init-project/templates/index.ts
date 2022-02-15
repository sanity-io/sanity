import type {ProjectTemplate} from '../initProject'
import * as blog from './blog'
import * as clean from './clean'
import * as ecommerce from './ecommerce'
import * as getStarted from './get-started'
import * as moviedb from './moviedb'
import * as shopify from './shopify'

const templates: Record<string, ProjectTemplate | undefined> = {
  blog,
  clean,
  moviedb,
  ecommerce,
  shopify,
  'get-started': getStarted,
}

export default templates
