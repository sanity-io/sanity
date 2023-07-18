import {BookIcon, CircleIcon} from '@sanity/icons'

export const circularCrossDatasetReferenceTest = {
  name: 'circularCrossDatasetReferenceTest',
  type: 'document',
  title: 'Circular cross dataset reference test',
  description: 'A test case for circular cross dataset reference',
  icon: CircleIcon,
  fields: [
    {name: 'title', type: 'string'},
    {
      name: 'refInPlayground',
      title: 'Reference to a circularCrossDatasetReference test document in the playground dataset',
      type: 'crossDatasetReference',
      dataset: 'playground',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground/content/${type};${id}`
          : null
      },
      to: [
        {
          type: 'circularCrossDatasetReferenceTest',
          icon: CircleIcon,
          preview: {
            select: {
              title: 'title',
            },
          },
        },
      ],
    },
    {
      name: 'refInTest',
      title: 'Reference to a circularCrossDatasetReference test document in the playground dataset',
      type: 'crossDatasetReference',
      dataset: 'test',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground/content/${type};${id}`
          : null
      },
      to: [
        {
          type: 'circularCrossDatasetReferenceTest',
          icon: CircleIcon,
          preview: {
            select: {
              title: 'title',
            },
          },
        },
      ],
    },
    {
      title: 'Article in docs dataset',
      name: 'docsArticle',
      type: 'crossDatasetReference',
      dataset: 'next',
      studioUrl: ({id, type}) => {
        return type ? `https://admin.sanity.io/desk/docs;${type};${id}` : null
      },
      to: [
        {
          type: 'article',
          icon: BookIcon,
          preview: {
            select: {
              title: 'title',
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      docsArticleTitleViaPlayground: 'refInPlayground.refInTest.docsArticle.title',
      docsArticleTitleViaTest: 'refInTest.refInPlayground.docsArticle.title',
      arbitraryDeep:
        'refInPlayground.refInTest.refInPlayground.refInTest.refInPlayground.refInTest.docsArticle.title',
    },
    prepare(values) {
      return {
        title: values.title,
        subtitle: values.arbitraryDeep
          ? `!${values.arbitraryDeep}!`
          : values.docsArticleTitleViaPlayground || values.docsArticleTitleViaTest,
      }
    },
  },
}
