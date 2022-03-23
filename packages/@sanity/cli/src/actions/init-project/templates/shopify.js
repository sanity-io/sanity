export const dependencies = {
  '@sanity/dashboard': '^2.21.7',
  'lodash.get': '^4.4.2',
  pluralize: '^8.0.0',
  'react-time-ago': '7.1.3',
  slug: '^5.1.0',
  'sanity-plugin-dashboard-widget-shopify': '^0.1.7',
  'sanity-plugin-media': '^1.4.3',
}

export const generateSanityManifest = (base) => ({
  ...base,
  plugins: ['@sanity/dashboard', ...base.plugins, 'dashboard-widget-shopify', 'media'],
  parts: [
    {
      name: 'part:@sanity/base/schema',
      path: './schemas/schema',
    },
    {
      name: 'part:@sanity/desk-tool/structure',
      path: './deskStructure.js',
    },
    {
      implements: 'part:@sanity/form-builder/input/image/asset-sources',
      path: './parts/assetSources.js',
    },
    {
      implements: 'part:@sanity/form-builder/input/file/asset-sources',
      path: './parts/assetSources.js',
    },
    {
      implements: 'part:@sanity/dashboard/config',
      path: './parts/dashboardConfig.js',
    },
    {
      name: 'part:@sanity/base/new-document-structure',
      path: './parts/newDocumentStructure.js',
    },
    {
      implements: 'part:@sanity/base/document-actions/resolver',
      path: './parts/resolveDocumentActions.js',
    },
  ],
})
