export default {
  name: 'slugsTest',
  type: 'document',
  title: 'Slugs test',
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current'
    },
    prepare: ({title, subtitle}) => {
      return {
        title: title,
        subtitle: subtitle && `/${subtitle}/`
      }
    }
  },
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Normal slug',
      description: 'This is a slug field that should update according to current title',
      options: {
        source: 'title',
        maxLength: 96
      }
    },
    {
      name: 'noSource',
      title: 'Slug with not source',
      type: 'slug',
      options: {
        maxLength: 100
      }
    },
    {
      name: 'requiredSlug',
      type: 'slug',
      title: 'Required slug',
      description: 'Slug field that is required',
      validation: Rule => Rule.required(),
      options: {
        source: 'title',
        maxLength: 96
      }
    },
    {
      name: 'slugWithFunction',
      type: 'slug',
      title: 'Slug with function to get source',
      description: 'This is a slug field that should update according to current title',
      options: {
        source: document => document.title,
        maxLength: 96
      }
    },
    {
      name: 'slugWithCustomUniqueCheck',
      type: 'slug',
      title: 'Slug with custom unique check',
      description: 'Slugs starting with "hei" are always taken, regardless of documents using it',
      options: {
        source: 'title',
        maxLength: 100,
        isUnique: (value, options) =>
          !/^hei/i.test(value) && options.defaultIsUnique(value, options)
      }
    },
    {
      name: 'arrayOfSlugs',
      type: 'array',
      of: [
        {
          options: {
            source: 'title'
          },
          type: 'slug'
        }
      ]
    },
    {
      name: 'experiments',
      title: 'Experiments',
      type: 'array',
      of: [{type: 'experiment'}]
    },
    {
      name: 'deprecatedSlugifyFnField',
      type: 'slug',
      title: 'Slug field using deprecated "slugifyFn" option',
      description: 'Should warn the developer about deprecated field',
      options: {
        source: 'title',
        slugifyFn: value =>
          value
            .toLocaleLowerCase()
            .split('')
            .reverse()
            .join('')
            .replace(/\s+/g, '-')
      }
    },
    {
      name: 'nested',
      type: 'object',
      fields: [
        {
          name: 'slugWithSlugify',
          type: 'slug',
          title: 'Custom slugify function',
          description: 'This is a slug field that should update according to current title',
          options: {
            source: 'title',
            maxLength: 96,
            slugify: (value, type) => {
              return encodeURI(`${type.name}_${value}`).toLocaleLowerCase()
            }
          }
        }
      ]
    },
    {
      name: 'async',
      type: 'slug',
      title: 'Async slug resolving',
      options: {
        source: doc => new Promise(resolve => setTimeout(resolve, 1000, doc.title))
      }
    }
  ]
}
