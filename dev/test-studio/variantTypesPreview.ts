import {type VariantTypesConfig} from 'sanity'

/** Demo variant types for the `/variant-types` workspace. */
export const previewVariantTypes = {
  variant: {
    label: 'Variant',
    conditions: [
      {
        name: 'audience',
        title: 'Audience',
        values: [
          {value: 'loyal', title: 'Loyal customers'},
          {value: 'new', title: 'New visitors'},
        ],
      },
    ],
  },
  language: {
    label: 'Language',
    description: 'Locale and country',
    conditions: [
      {
        name: 'locale',
        title: 'Locale',
        values: ['en-US', 'nb-NO', 'de-DE'],
      },
      {
        name: 'country',
        title: 'Country',
        values: ['us', 'no', 'de'],
      },
    ],
  },
  experimentation: {
    label: 'Experimentation',
    description: 'A/B test variants',
    conditions: [
      {
        name: 'experiment',
        title: 'Experiment',
        values: [
          {value: 'variant-a', title: 'Variant A'},
          {value: 'variant-b', title: 'Variant B'},
          {value: 'variant-c', title: 'Variant C'},
        ],
      },
    ],
  },
} satisfies VariantTypesConfig
