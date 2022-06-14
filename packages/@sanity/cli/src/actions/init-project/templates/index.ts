import type {ProjectTemplate} from '../initProject'
import blog from './blog'
import clean from './clean'
import moviedb from './moviedb'

/*
// @todo DISABLED UNTIL THEY WORK WITH v3
import ecommerce from './ecommerce'
import getStarted from './get-started'
import shopify from './shopify'
*/

const templates: Record<string, ProjectTemplate | undefined> = {
  blog,
  clean,
  moviedb,
  //ecommerce,
  //shopify,
  //'get-started': getStarted,
}

export default templates
