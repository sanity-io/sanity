import React from 'react';
import Icon from '../components/icon';

export default {
  name: 'studioTutorials',
  title: 'Studio tutorials',
  icon: () => <Icon emoji="📃" />,
  type: 'document',
  fields: [
    {
      name: 'chosenGuides',
      title: 'Guides that will show as tutorials in the studio',
      description: 'The order isn\'t relevant, yet',
      // description: '💡 the order is important here, it\'ll define the order of the sidebar.',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'contribution.guide'}],
          options: {
            filter: 'defined(body)',
          },
        },
      ],
    },
  ],
  preview: {
    prepare() {
      return {
        title: "Studio tutorials",
      };
    },
  },
};
