import {TargetIcon} from '@sanity/icons/Target'
import {type Tool} from 'sanity'

import {BisectTool} from './BisectTool'

/** Guided bisect over mainline preview builds — see BisectTool. */
export const bisectTool: Tool = {
  name: 'bisect',
  title: 'Bisect',
  icon: TargetIcon,
  component: BisectTool,
}
