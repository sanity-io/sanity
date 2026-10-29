import {SplitHorizontalIcon} from '@sanity/icons/SplitHorizontal'
import {type Tool} from 'sanity'

import {ComparisonsTool} from './ComparisonsTool'

/** The stored A/B dispatch comparisons — see ComparisonsTool. */
export const comparisonsTool: Tool = {
  name: 'comparisons',
  title: 'Comparisons',
  icon: SplitHorizontalIcon,
  component: ComparisonsTool,
}
