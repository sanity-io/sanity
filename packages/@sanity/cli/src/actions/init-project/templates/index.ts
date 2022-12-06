import type {ProjectTemplate} from '../initProject'
import blog from './blog'
import clean from './clean'
import moviedb from './moviedb'
import shopify from './shopify'

const templates: Record<string, ProjectTemplate | undefined> = {
  blog,
  clean,
  moviedb,
  shopify,
}

export default templates
