export interface PluginTemplate {
  value: string
  name: string
  url: string
}

export const pluginTemplates: PluginTemplate[] = [
  {
    value: 'logo',
    name: 'Studio logo',
    url: 'https://github.com/sanity-io/plugin-template-logo/archive/master.zip',
  },
  {
    value: 'tool',
    name: 'Basic, empty tool',
    url: 'https://github.com/sanity-io/plugin-template-tool/archive/master.zip',
  },
  {
    value: 'toolWithRouting',
    name: 'Tool with basic routing',
    url: 'https://github.com/sanity-io/plugin-template-tool-with-routing/archive/master.zip',
  },
  {
    value: 'chessInput',
    name: 'Chess board input component w/ block preview',
    url: 'https://github.com/sanity-io/plugin-template-chess-input/archive/master.zip',
  },
  {
    value: 'dashboardWidget',
    name: 'A Dashboard widget with cats',
    url: 'https://github.com/sanity-io/plugin-template-dashboard-widget-cats/archive/master.zip',
  },
  {
    value: 'assetSource',
    name: 'Custom asset source plugin',
    url: 'https://github.com/sanity-io/plugin-template-asset-source/archive/master.zip',
  },
]
