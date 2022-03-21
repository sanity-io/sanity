export const dependencies = {}

export const generateSanityManifest = (base) => ({
  ...base,
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
  ],
})
