import {getTaxonomySchema} from './getTaxonomy';

export default getTaxonomySchema({
  name: 'contributionType',
  title: 'Contribution type',
  emoji: '🎁',
  description:
    'Used by taxonomy.combination to create landing pages, as well as by each individual type page to fetch SEO fields',
  // Types' slugs are set in stone and won't change, no need for author control here
  includeSlug: false,
  // These are always indexable
  includeIndexable: false,
  extraFields: [
    {
      name: 'contributionType',
      title: 'Applicable to what type of contribution?',
      description: 'This isn\'t customizable, don\'t worry about this field :)',
      type: 'string',
      options: {
        list: [
          {
            value: 'contribution.guide',
            title: 'Guides',
          },
          {
            value: 'contribution.tool',
            title: 'Plugins & tools',
          },
          {
            value: 'contribution.showcaseProject',
            title: 'Showcase projects',
          },
          {
            value: 'contribution.starter',
            title: 'Starters',
          },
          {
            value: 'contribution.schema',
            title: 'Schemas',
          },
          {
            value: 'contribution.snippet',
            title: 'Snippets',
          },
          {
            value: 'contribution.event',
            title: 'Events',
          },
        ],
      },
    },
  ],
});
