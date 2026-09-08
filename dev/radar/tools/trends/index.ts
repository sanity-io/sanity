import {TrendUpwardIcon} from '@sanity/icons/TrendUpward'
import {type Tool} from 'sanity'

import {TrendsTool} from './TrendsTool'

/** The landing view of the studio — registered first in sanity.config.ts. */
export const trendsTool: Tool = {
  name: 'trends',
  title: 'Trends',
  icon: TrendUpwardIcon,
  component: TrendsTool,
}
