export const dependencies = {
  'sanity-plugin-asset-source-unsplash': '^0.2.1',
  'sanity-plugin-media': '^1.4.10',
}

export const generateSanityManifest = (base) => ({
  ...base,
  plugins: base.plugins.concat(['asset-source-unsplash', 'media']),

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
      implements: 'part:@sanity/base/root',
      path: 'plugins/sanity-plugin-tutorial/CustomDefaultLayout',
    },
    {
      implements: 'part:@sanity/base/brand-logo',
      path: './components/logo/petsProjectLogo.jsx',
    },
    {
      implements: 'part:@sanity/base/theme/variables/override-style',
      path: './style.css',
    },
  ],
})
