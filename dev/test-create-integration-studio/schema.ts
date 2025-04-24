import {defineArrayMember, defineField, defineType, type FieldGroupDefinition} from 'sanity'

export const mainGroup: FieldGroupDefinition = {
  name: 'main',
  title: 'Common fields',
}
export const seoGroup: FieldGroupDefinition = {
  name: 'seo',
  title: 'SEO fields',
}

export const schemaTypes = [
  defineType({
    type: 'document',
    name: 'sanity-create-excluded',
    fields: [
      defineField({
        name: 'title',
        title: 'New documents of this type should not have a Start in Create button',
        type: 'string',
      }),
    ],
    options: {
      sanityCreate: {exclude: true},
    },
  }),
  defineType({
    type: 'document',
    name: 'has-initial-values',
    fields: [
      defineField({
        name: 'title',
        title: 'Documents with initial values are disabled for Create',
        type: 'string',
        initialValue: () =>
          new Promise<string>((resolve) => {
            setTimeout(() => {
              resolve('Delayed initial value')
            }, 5000)
          }),
      }),
      defineField({
        name: 'description',
        title:
          'When any value resolves, the Start in Create button disappears. This is not perfect, but "good enough" for now.',
        type: 'string',
        initialValue: 'Initial value',
      }),
    ],
  }),
  defineType({
    type: 'document',
    liveEdit: true,
    name: 'has-live-edit',
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        initialValue: 'Live edit',
      }),
      defineField({
        name: 'description',
        type: 'string',
        initialValue: 'Live edit description',
      }),
    ],
  }),
  defineType({
    title: 'Documentation Article',
    name: 'create-test-article',
    type: 'document',
    groups: [mainGroup, seoGroup],
    fieldsets: [{name: 'switches', title: 'Article settings', options: {columns: 2}}],
    fields: [
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
        description: 'Main header and page title.',
        group: [mainGroup.name],
      }),
      defineField({
        name: 'description',
        title: 'Description',
        type: 'text',
        rows: 3,
        description: 'Lede and page summary.',
        group: [mainGroup.name],
      }),
      defineField({
        type: 'image',
        name: 'image',
        title: 'Image',
        description: 'Primary image for content.',
        group: [mainGroup.name],
      }),
      defineField({
        name: 'authors',
        title: 'Authors',
        type: 'array',
        description: 'One or more content authors',
        validation: (Rule) => Rule.required().min(1).unique(),
        of: [
          defineArrayMember({
            type: 'object',
            name: 'authors',
            title: 'Authors',
            fields: [
              defineField({
                type: 'string',
                name: 'name',
                title: 'Full Name',
              }),
              defineField({
                type: 'string',
                name: 'email',
                title: 'Email',
              }),
            ],
          }),
        ],
        group: [mainGroup.name],
      }),
      {
        title: 'Slug',
        name: 'slug',
        type: 'slug',
        description: 'Last part of the page URL.',
        options: {
          source: 'title',
          auto: true,
        },
      },
      {
        title: 'Hide this article?',
        name: 'hidden',
        type: 'boolean',
        description: 'Turn this on to prevent this document from showing up in search results.',
      },
      {
        title: 'Enterprise Feature',
        name: 'enterprise',
        type: 'boolean',
        description: 'This article describes a feature only available on enterprise plans',
      },
      {
        title: 'Experimental Feature',
        name: 'experimental',
        type: 'boolean',
        description:
          'This article describes a feature that should be considered experimental, where the API and feature set might change',
      },
      {
        title: 'Body',
        name: 'body',
        type: 'blockContent',
      },
      {
        title: 'Search keywords',
        name: 'keywords',
        type: 'array',
        of: [{type: 'string'}],
        options: {
          layout: 'tags',
        },
        description: 'A list of keywords to supplement search index.',
      },
      {
        title: 'Related Articles',
        name: 'articles',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [{type: 'create-test-article'}],
          },
        ],
      },
      defineField({
        name: 'seoTitle',
        title: 'SEO Title',
        type: 'string',
        description: 'Will override title used for SEO and social media previews.',
        group: [seoGroup.name],
      }),
      defineField({
        name: 'seoDescription',
        title: 'SEO Description',
        type: 'text',
        rows: 3,
        description: 'Will override description used for SEO and social media previews.',
        group: [seoGroup.name],
      }),
      defineField({
        name: 'seoImage',
        title: 'SEO Image',
        type: 'image',
        description: 'Will override image used for SEO and social media previews.',
        group: [seoGroup.name],
      }),
    ],
  }),
  defineType({
    title: 'Block Content',
    name: 'blockContent',
    type: 'array',
    of: [
      {
        title: 'Block',
        type: 'block',
        styles: [
          {title: 'Normal', value: 'normal'},
          {title: 'H1', value: 'h1'},
          {title: 'H2', value: 'h2'},
          {title: 'H3', value: 'h3'},
          {title: 'H4', value: 'h4'},
          {title: 'Quote', value: 'blockquote'},
        ],
        marks: {
          decorators: [
            {title: 'Strong', value: 'strong'},
            {title: 'Emphasis', value: 'em'},
            {title: 'Code', value: 'code'},
          ],
          annotations: [
            {
              title: 'Abbreviation',
              name: 'abbreviation',
              type: 'object',
              description: 'Add definitions for abbreviations, initialisms, and acronyms',
              fields: [
                {
                  title: 'Expansion',
                  name: 'title',
                  type: 'string',
                  description: 'Spell out the full term',
                },
              ],
            },
          ],
        },
      },
      {
        title: 'Call to action',
        name: 'callToAction',
        type: 'object',
        fields: [
          {
            title: 'Label',
            name: 'label',
            type: 'string',
          },
          {
            title: 'Url',
            name: 'url',
            type: 'string',
          },
        ],
      },
      {
        title: 'Image',
        type: 'image',
        options: {
          hotspot: true,
        },
        preview: {
          select: {
            imageUrl: 'asset.url',
            title: 'caption',
          },
        },
        fields: [
          {
            title: 'Caption',
            name: 'caption',
            type: 'string',
          },
          {
            name: 'alt',
            type: 'string',
            title: 'Alt text',
            description: 'Alternative text for screenreaders. Falls back on caption if not set',
          },
          {
            title: 'Enable lightbox',
            description:
              '❓ Optional. The default behavior is to enable it if image is large enough to benefit from it.',
            name: 'enableLightbox',
            type: 'boolean',
          },
          {
            title: 'Icon',
            name: 'isIcon',
            type: 'boolean',
          },
          {
            title: 'Disable shadow',
            description: 'Not implemented in most surfaces.',
            name: 'disableShadow',
            type: 'boolean',
          },
          {
            title: 'Large',
            description: 'Not implemented in most surfaces.',
            name: 'isLarge',
            type: 'boolean',
          },
          {
            name: 'infoBox',
            title: 'Info Box',
            type: 'object',
            fields: [
              {
                name: 'title',
                title: 'Title',
                type: 'string',
              },
            ],
          },
        ],
      },
      {
        name: 'infoBox',
        title: 'Info Box',
        type: 'object',
        fields: [
          {
            name: 'title',
            title: 'Title',
            type: 'string',
          },
          {
            title: 'Box Content',
            name: 'body',
            type: 'text',
          },
        ],
        preview: {
          select: {
            title: 'title',
            body: 'body',
          },
          prepare(selection) {
            return selection
          },
        },
      },
      {name: 'code', type: 'code'},
      {
        name: 'protip',
        type: 'object',
        fields: [
          {
            title: 'Protip',
            name: 'body',
            type: 'text',
          },
        ],
        preview: {
          select: {
            body: 'body',
          },
          prepare(selection) {
            return selection
          },
        },
      },
      {
        name: 'gotcha',
        type: 'object',
        fields: [
          {
            title: 'Gotcha',
            name: 'body',
            type: 'text',
          },
        ],
        preview: {
          select: {
            body: 'body',
          },
          prepare(selection) {
            return selection
          },
        },
      },
      {
        name: 'example',
        type: 'object',
        fields: [
          {
            title: 'Example',
            name: 'body',
            description: 'Use this to exemplify something that’s not just a code block',
            type: 'text',
          },
        ],
        preview: {
          select: {
            body: 'body',
          },
          prepare(selection) {
            return selection
          },
        },
      },
    ],
  }),
]
