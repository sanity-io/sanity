import {definePlugin} from 'sanity'
import {IceCreamIcon} from '@sanity/icons'
import {ColorCanvas} from './ColorCanvas'

export function themePreviewTool() {
  return definePlugin({
    name: 'design-studio/theme-preview-tool',
    tools: [
      {
        icon: IceCreamIcon,
        name: 'theme-preview',
        title: 'Theme preview',
        component: ColorCanvas,
        options: {},
      },
    ],
  })
}
