import {SanityTool} from '@sanity/base'
import {TerminalIcon} from '@sanity/icons'
import {DebugTool} from './DebugTool'

export const debugTool: SanityTool = {
  name: 'debug',
  title: 'Debug',
  icon: TerminalIcon,
  component: DebugTool,
  options: {},
}
