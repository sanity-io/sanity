export const contributionInitialValue = () => {
  // Admins won't necessarily add themselves as authors
  if (window._sanityUser?.role === 'administrator') {
    return {};
  }
  const curUserId = window._sanityUser?.id;
  return {
    authors: curUserId
      ? [
          {
            _type: 'reference',
            _ref: curUserId,
          },
        ]
      : [],
  };
};

/**
 * Centralized way to maintain taxonomies for all contributions
 * @param type: _type without the "contribution." part
 */
export const getContributionTaxonomies = (
  type,
  {categories, frameworks, tools, integrations, solutions}
) => {
  const taxonomies = [];
  if (solutions?.title) {
    taxonomies.push({
      name: 'solutions',
      title: solutions.title,
      description: solutions.description,
      type: 'array',
      of: [
        {
          type: 'reference',
          title: `Reference to ${type} solution`,
          to: [{type: 'taxonomy.solution'}],
          options: !!type ? {
            filter: '$type in applicableTo',
            filterParams: {
              type: `contribution.${type}`,
            },
          } : {},
        },
      ],
    });
  }
  if (categories?.title) {
    taxonomies.push({
      name: 'categories',
      title: categories.title,
      description: categories.description,
      type: 'array',
      // We're migrating off categories, hence the need to hide them
      // hidden: true,
      of: [
        {
          type: 'reference',
          title: `Reference to ${type} category`,
          to: [{type: 'taxonomy.category'}],
          options: !!type ? {
            filter: '$type in applicableTo',
            filterParams: {
              type: `contribution.${type}`,
            },
          } : {},
        },
      ],
    });
  }
  if (frameworks?.title) {
    taxonomies.push({
      name: 'frameworks',
      title: frameworks?.title,
      description: frameworks?.description,
      type: 'array',
      of: [
        {
          type: 'reference',
          title: 'Reference to framework',
          to: [{type: 'taxonomy.framework'}],
        },
      ],
    });
  }
  if (integrations?.title) {
    taxonomies.push({
      name: 'integrations',
      title: integrations?.title,
      description: integrations?.description,
      type: 'array',
      of: [
        {
          type: 'reference',
          title: 'Reference to integration/service',
          to: [{type: 'taxonomy.integration'}],
        },
      ],
    });
  }
  if (tools?.title) {
    taxonomies.push({
      name: 'tools',
      title: tools?.title,
      description: tools?.description,
      type: 'array',
      of: [
        {
          type: 'reference',
          title: 'Reference to community tools',
          to: [{type: 'contribution.tool'}],
        },
      ],
    });
  }
  return taxonomies
};
