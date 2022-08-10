export const datasetUrl = 'https://public.sanity.io/pets-example-dataset-2022-06-20.tar.gz'
export const dependencies = {
  'sanity-plugin-asset-source-unsplash': '^0.2.1',
  'sanity-plugin-media': '^1.4.10',
  '@sanity/icons': '^1.2.6',
  '@portabletext/react': '^1.0.6',
  'react-fast-compare': '^3.2.0',
  rxjs: '^6.5.3',
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
