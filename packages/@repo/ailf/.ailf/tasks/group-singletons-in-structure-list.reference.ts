import {defineConfig, defineType, defineField} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Company website',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .id('settings')
              .title('Settings')
              .child(
                S.list()
                  .id('settings')
                  .title('Settings')
                  .singletons(['siteSettings', 'seoSettings', 'socialLinks']),
              ),
            S.divider(),
            ...S.documentTypeListItems(),
          ]),
    }),
  ],
  document: {
    singletons: ['siteSettings', 'seoSettings', 'socialLinks'],
  },
  schema: {
    types: [
      defineType({
        name: 'siteSettings',
        title: 'Site settings',
        type: 'document',
        fields: [
          defineField({
            name: 'siteTitle',
            title: 'Site title',
            type: 'string',
          }),
        ],
      }),
      defineType({
        name: 'seoSettings',
        title: 'SEO defaults',
        type: 'document',
        fields: [
          defineField({
            name: 'metaDescription',
            title: 'Meta description',
            type: 'text',
          }),
        ],
      }),
      defineType({
        name: 'socialLinks',
        title: 'Social links',
        type: 'document',
        fields: [
          defineField({
            name: 'links',
            title: 'Links',
            type: 'array',
            of: [{type: 'url'}],
          }),
        ],
      }),
      defineType({
        name: 'article',
        title: 'Article',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
        ],
      }),
    ],
  },
})
